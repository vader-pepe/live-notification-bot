const {SlashCommandBuilder, PermissionFlagsBits} = require("discord.js");
const db = require("../db");

const data = new SlashCommandBuilder()
  .setName("tagrole")
  .setDescription("Pilih role untuk di tag pada live notifications")
  .addRoleOption((option) =>
    option
      .setName("roles")
      .setDescription("Role yang ingin ditag")
      .setRequired(true)
  );

async function run({interaction, client}) {
  if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
    return interaction.reply({
      content: "Maaf kamu tidak punya izin untuk menggunakan perintah ini",
      ephemeral: true,
    });
  }

  const role = interaction.options.getRole("roles");
  const guildId = interaction.guild.id;

  db.run(
    `INSERT OR REPLACE INTO tag_roles (guild_id, role_id) VALUES (?, ?)`,
    [guildId, role.id],
    function (err) {
      if (err) {
        return interaction.reply({
          content: "Terjadi error saat menyimpan role.",
          ephemeral: true,
        });
      }
      return interaction.reply({
        content: `Berhasil menyimpan role ${role} untuk notifikasi live.`,
        ephemeral: true,
      });
    }
  );
}

module.exports = { data, run };

// /tagrole : Automatically tag a role when a live stream starts
