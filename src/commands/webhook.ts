import db from "@/common/utils/db";
import { env } from "@/common/utils/envConfig";
import type { SlashCommandProps } from "commandkit";
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  type ChatInputCommandInteraction,
  type Client,
  EmbedBuilder,
  Interaction,
  type MessageComponentInteraction,
  SlashCommandBuilder,
  TextChannel,
} from "discord.js";

const OWNER_ID = env.OWNER_ID;

export const data = new SlashCommandBuilder()
  .setName("webhook")
  .setDescription("Mendaftarkan webhook untuk live notifications")
  .addStringOption((option) =>
    option.setName("url").setDescription("URL webhook yang ingin didaftarkan").setRequired(true),
  );

export async function run({ interaction, client }: SlashCommandProps) {
  const webhookUrl = interaction.options.getString("url");
  if (webhookUrl) {
    const webhookRegex = /^https:\/\/discord\.com\/api\/webhooks\/\d+\/[A-Za-z0-9_-]+$/;
    if (!webhookRegex.test(webhookUrl)) {
      return interaction.reply({
        content: "URL webhook tidak valid. Pastikan URL sesuai format webhook Discord.",
        ephemeral: true,
      });
    }

    db.get(`SELECT url FROM webhook WHERE url = ?`, [webhookUrl], (err, row) => {
      if (err) {
        console.error("Database error:", err.message);
        return interaction.reply({
          content: "Terjadi error saat memeriksa database.",
          ephemeral: true,
        });
      }

      if (row) {
        return interaction.reply({
          content: "Webhook tersebut sudah terdaftar di database.",
          ephemeral: true,
        });
      }

      processWebhookRequest(interaction, client, webhookUrl);
    });
  }
}

async function processWebhookRequest(interaction: ChatInputCommandInteraction, client: Client, webhookUrl: string) {
  const approvalChannel = await client.channels.fetch(env.WEBHOOK_APPROVAL_ID);
  const guild = interaction.guild;
  if (guild) {
    const guildId = guild.id;
    if (!approvalChannel) {
      return interaction.reply({
        content: "Tidak dapat menemukan channel persetujuan webhook.",
        ephemeral: true,
      });
    }

    const embed = new EmbedBuilder()
      .setTitle("Webhook Request")
      .setDescription(`Terdapat permintaan webhook baru yang membutuhkan persetujuan.`)
      .addFields(
        { name: "User ID", value: interaction.user.id, inline: true },
        { name: "Guild ID", value: interaction.guild.id, inline: true },
        { name: "Webhook URL", value: webhookUrl },
      )
      .setFooter({ text: "Gunakan tombol di bawah untuk approve atau deny." })
      .setColor("#ff0000")
      .setTimestamp();

    const buttons = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId(`approve_${interaction.id}`).setLabel("Approve").setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId(`deny_${interaction.id}`).setLabel("Deny").setStyle(ButtonStyle.Danger),
    );

    if (approvalChannel instanceof TextChannel) {
      const message = await approvalChannel.send({
        content: `<@${OWNER_ID}>`,
        embeds: [embed],
        components: [buttons],
      });

      interaction.reply({
        content: "Permintaan webhook Anda sedang diproses. Silakan tunggu persetujuan dari admin.",
        ephemeral: true,
      });

      let isProcessed = false;

      const filter = (btnInteraction: MessageComponentInteraction) =>
        btnInteraction.customId.startsWith("approve_") || btnInteraction.customId.startsWith("deny_");
      const collector = message.createMessageComponentCollector({
        filter,
        time: 60000,
      });

      collector.on("collect", async (btnInteraction: MessageComponentInteraction) => {
        if (btnInteraction.user.id !== OWNER_ID) {
          return btnInteraction.reply({
            content: "Hanya owner bot yang dapat menggunakan tombol ini.",
            ephemeral: true,
          });
        }

        let result = "";
        if (btnInteraction.customId === `approve_${interaction.id}`) {
          db.run(
            `INSERT INTO webhook (url, user_id, guild_id) VALUES (?, ?, ?)`,
            [webhookUrl, interaction.user.id, guildId],
            (err) => {
              if (err) {
                console.error("Error saving webhook to database:", err.message);
                return btnInteraction.reply({
                  content: "Terjadi error saat menyimpan webhook ke database.",
                  ephemeral: true,
                });
              }

              interaction.user.send(`Permintaan webhook Anda telah disetujui.`);
            },
          );
          result = "Approved";
          btnInteraction.reply({
            content: "Webhook telah disetujui dan disimpan ke database.",
            ephemeral: true,
          });
        } else if (btnInteraction.customId === `deny_${interaction.id}`) {
          interaction.user.send(`Permintaan webhook Anda telah ditolak.`);
          result = "Denied";
          btnInteraction.reply({
            content: "Webhook request telah ditolak.",
            ephemeral: true,
          });
        }

        isProcessed = true;
        const updatedEmbed = EmbedBuilder.from(embed)
          .setColor(result === "Approved" ? "#00ff00" : "#000000")
          .addFields({ name: "Result", value: result })
          .setFooter({ text: "Permintaan telah diproses." });

        await message.edit({ embeds: [updatedEmbed], components: [] });
      });

      collector.on("end", async () => {
        if (!isProcessed) {
          const expiredEmbed = EmbedBuilder.from(embed)
            .setColor("#595959")
            .addFields({ name: "Result", value: "Expired" })
            .setFooter({ text: "Permintaan kadaluarsa." });

          await message.edit({ embeds: [expiredEmbed], components: [] });
          await interaction.user.send(`Permintaan webhook Anda Expired, silahkan request ulang!`);
        }
      });
    }
  }
}
