const {SlashCommandBuilder, PermissionFlagsBits} = require("discord.js");
const db = require("../db");

const data = new SlashCommandBuilder()
  .setName("removetagrole")
  .setDescription("Hapus role yang ditag pada live notifications");

async function run({interaction, client}) {
  if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
    return interaction.reply({
      content: "Maaf kamu tidak punya izin untuk menggunakan perintah ini",
      ephemeral: true,
    });
  }

  const guildId = interaction.guild.id;

  db.get(
    `SELECT role_id FROM tag_roles WHERE guild_id = ?`,
    [guildId],
    (err, row) => {
      if (err) {
        return interaction.reply({
          content: "Terjadi error saat memeriksa role.",
          ephemeral: true,
        });
      }

      if (!row) {
        return interaction.reply({
          content: "Tidak ada role yang di set untuk automatic tag.",
          ephemeral: true,
        });
      }

      db.run(
        `DELETE FROM tag_roles WHERE guild_id = ?`,
        [guildId],
        function (err) {
          if (err) {
            return interaction.reply({
              content: "Terjadi error saat menghapus role.",
              ephemeral: true,
            });
          }
          return interaction.reply({
            content: "Berhasil menghapus role untuk notifikasi live.",
            ephemeral: true,
          });
        }
      );
    }
  );
}

module.exports = {data, run};
