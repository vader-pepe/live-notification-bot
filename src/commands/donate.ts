import type { SlashCommandProps } from "commandkit";
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, SlashCommandBuilder } from "discord.js";

export const data = new SlashCommandBuilder()
  .setName("donate")
  .setDescription("Donasi untuk kelangsungan bot JKT48 live notifications");

export async function run({ interaction, client }: SlashCommandProps) {
  const initialEmbed = new EmbedBuilder()
    .setColor("#ff0000")
    .setTitle("Help Donation for JKT48 live notifications BOT")
    .setDescription(
      "Bantu berdonasi agar JKT48 live notifications BOT ini tetap terus hidup! \n\n> Jika anda ingin berdonasi\n> Donasi melalui Saweria https://saweria.co/ryuu48\n> \n> Log Donasi tersedia di [Server Support](https://https://discord.gg/TZCSuEAn3j)!\n> Semua dukungan donasi kalian akan sangat berguna untuk JKT48 live notifications BOT ini!",
    )
    .setImage("https://i.pinimg.com/564x/39/06/f9/3906f9ad68de2c0b8ae68a8b79ac7772.jpg")
    .setAuthor({
      name: "JKT48 Live Notification",
      iconURL: client.user.displayAvatarURL(),
    })
    .setFooter({ text: "JKT48 Live Notification | Created by RyuuG" });

  const initialButton = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setStyle(ButtonStyle.Link).setURL("https://saweria.co/ryuu48").setLabel("Donasi"),
  );

  await interaction.reply({
    embeds: [initialEmbed],
    components: [initialButton],
    ephemeral: true,
  });
}
