import type { Birthday } from "@/common/utils/birthday";
import { env } from "@/common/utils/envConfig";
import axios from "axios";
import type { SlashCommandProps } from "commandkit";
import { EmbedBuilder, SlashCommandBuilder } from "discord.js";

export const data = new SlashCommandBuilder()
  .setName("birthday")
  .setDescription("Menampilkan data ulang tahun member JKT48");

export async function run({ interaction }: SlashCommandProps) {
  try {
    const response = await axios.get<Birthday[]>(`http://${env.HOST}:${env.PORT}/birthdays`);
    const birthdays = response.data;

    if (birthdays.length === 0) {
      return interaction.reply({
        content: "Tidak ada data ulang tahun member yang tersedia.",
        ephemeral: true,
      });
    }

    const embed = new EmbedBuilder().setTitle("Data Ulang Tahun Member Selanjutnya").setColor("#ff0000");

    birthdays.forEach((member) => {
      const birthYear = Number(member.birthday.split(" ").pop() || "0");
      const currentYear = new Date().getFullYear();
      const age = currentYear - birthYear;

      embed.addFields({
        name: member.name,
        value: `📅 **${member.birthday}**\n🎂 Ulang tahun ke-${age}\n🔗 [Profile Member](https://jkt48.com${member.profileLink})\n`,
        inline: false,
      });
    });

    await interaction.reply({ embeds: [embed], ephemeral: true });
  } catch (error) {
    console.error("Error fetching birthdays:", error);
    await interaction.reply({
      content: "Terjadi kesalahan saat mengambil data ulang tahun.",
      ephemeral: true,
    });
  }
}
