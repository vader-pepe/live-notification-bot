const {
  SlashCommandBuilder,
  TextChannel,
  EmbedBuilder,
  ButtonBuilder,
  ActionRowBuilder,
  ButtonStyle,
} = require("discord.js");

const data = new SlashCommandBuilder()
  .setName("help")
  .setDescription("Help for JKT48 live notifications");

async function run({interaction, client}) {
  const initialEmbed = new EmbedBuilder()
    .setColor("#ff0000")
    .setAuthor({
      name: "JKT48 Notification Help",
      iconURL: client.user.displayAvatarURL(),
    })
    .setTitle("Help for JKT48 live notifications")
    .setDescription("List of commands:")
    .addFields(
      {
        name: "/whitelist",
        value: "Menambahkan whitelist channel untuk live notifications.",
      },
      {name: "/ping", value: "Ping the bot"},
      {
        name: "/removewhitelist",
        value: "Menghapus whitelist channel untuk live notifications.",
      },
      {
        name: "/tagrole",
        value: "Role akan otomatis tertag saat notifikasi member sedang live.",
      },
      {
        name: "/removetagrole",
        value: "Menghapus tag role saat notifikasi member sedang live.",
      },
      {
        name: "Butuh Bantuan?",
        value: "[Server Support](https://discord.gg/TZCSuEAn3j)",
      }
    )
    .setFooter({text: "JKT48 Live Notification"});

  const commandsEmbed = new EmbedBuilder()
    .setColor("#ff0000")
    .setAuthor({
      name: "JKT48 Notification Help",
      iconURL: client.user.displayAvatarURL(),
    })
    .setTitle("Help for JKT48 live notifications")
    .setDescription("List of commands:")
    .addFields(
      {
        name: "/whitelist",
        value: "Menambahkan whitelist channel untuk live notifications.",
      },
      {name: "/ping", value: "Ping the bot"},
      {
        name: "/removewhitelist",
        value: "Menghapus whitelist channel untuk live notifications.",
      },
      {
        name: "/tagrole",
        value: "Role akan otomatis tertag saat notifikasi member sedang live.",
      },
      {
        name: "/removetagrole",
        value: "Menghapus tag role saat notifikasi member sedang live.",
      },
      {
        name: "Butuh Bantuan?",
        value: "[Server Support](https://discord.gg/TZCSuEAn3j)",
      }
    )
    .setFooter({text: "JKT48 Live Notification"});

  const permissionsEmbed = new EmbedBuilder()
    .setColor("#ff0000")
    .setAuthor({
      name: "JKT48 Notification Help",
      iconURL: client.user.displayAvatarURL(),
    })
    .setTitle("Help for JKT48 live notifications")
    .setDescription("List of permissions channel:")
    .addFields(
      {
        name: "view channel",
        value: "Agar bot bisa mengakses channel yang anda whitelist",
      },
      {
        name: "send message",
        value: "Agar bot bisa mengirimkan Live Notification pada channel anda",
      },
      {
        name: "embed links",
        value: "Agar bot bisa mengirimkan embed message pada channel anda",
      },
      {
        name: "Butuh Bantuan?",
        value: "[Server Support](https://discord.gg/TZCSuEAn3j)",
      }
    )
    .setFooter({text: "JKT48 Live Notification"});

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("commands")
      .setLabel("Commands")
      .setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
      .setCustomId("permissions")
      .setLabel("Permissions")
      .setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
      .setLabel("Vote Bot")
      .setURL("https://top.gg/bot/1253053660242514022/vote")
      .setStyle(ButtonStyle.Link),
    new ButtonBuilder()
      .setLabel("Donate me")
      .setURL("https://saweria.co/Ryuu48")
      .setStyle(ButtonStyle.Link)
  );

  await interaction.reply({
    embeds: [initialEmbed],
    components: [row],
    ephemeral: true,
  });

  const filter = (i) =>
    i.customId === "commands" || i.customId === "permissions";
  const collector = interaction.channel.createMessageComponentCollector({
    filter,
    time: 60000,
  });

  collector.on("collect", async (i) => {
    if (i.customId === "commands") {
      await i.update({embeds: [commandsEmbed], components: [row]});
    } else if (i.customId === "permissions") {
      await i.update({embeds: [permissionsEmbed], components: [row]});
    }
  });
}

module.exports = {data, run};
