const {
  SlashCommandBuilder,
  EmbedBuilder,
  StringSelectMenuBuilder,
  ActionRowBuilder,
  ComponentType,
} = require("discord.js");
const fs = require("fs");

const data = new SlashCommandBuilder()
  .setName("member")
  .setDescription("Lihat daftar member berdasarkan generasi");

let membersData = [];
try {
  const raw = fs.readFileSync("src/member.json", "utf8");
  membersData = JSON.parse(raw);
} catch (err) {
  console.error("❗ Gagal membaca member.json:", err);
}

const getGenerations = () => {
  const gens = new Set();
  membersData.forEach((m) => gens.add(m.generation));
  return Array.from(gens).sort();
};

const getMembersByGeneration = (gen) => {
  return membersData.filter((m) => m.generation === gen && !m.is_graduate);
};

const getMemberByName = (name) => {
  return membersData.find((m) => m.name === name);
};

async function run({interaction}) {
  await interaction.deferReply({ephemeral: true});

  const generations = getGenerations();

  const genSelect = new StringSelectMenuBuilder()
    .setCustomId("select_gen")
    .setPlaceholder("Pilih generasi member")
    .addOptions(
      generations.map((gen) => ({
        label: gen,
        value: gen,
      }))
    );

  const row = new ActionRowBuilder().addComponents(genSelect);

  await interaction.editReply({
    content: "Pilih generasi:",
    components: [row],
  });
}

async function handleSelect(interaction) {
  if (!interaction.isStringSelectMenu()) return;

  await interaction.deferUpdate();

  const customId = interaction.customId;
  const selectedValue = interaction.values[0];

  if (customId === "select_gen") {
    const members = getMembersByGeneration(selectedValue);

    const memberSelect = new StringSelectMenuBuilder()
      .setCustomId("select_member")
      .setPlaceholder(`Pilih member dari ${selectedValue}`)
      .addOptions(
        members.map((m) => ({
          label: m.name,
          value: m.name,
        }))
      );

    const row = new ActionRowBuilder().addComponents(memberSelect);

    await interaction.editReply({
      content: `Pilih member dari ${selectedValue}:`,
      components: [row],
    });
  } else if (customId === "select_member") {
    const member = getMemberByName(selectedValue);
    if (!member) return;

    const embed = new EmbedBuilder()
      .setTitle(member.name)
      .setThumbnail(member.img)
      .setDescription(`${member.description}\n\n${member.jikosokai}`)
      .addFields(
        {name: "Nickname", value: member.nicknames.join(", "), inline: true},
        {name: "Height", value: member.height, inline: true},
        {name: "Generation", value: member.generation, inline: true},
        {
          name: "Video Perkenalan",
          value: `https://youtu.be/${member.video_perkenalan}`,
          inline: false,
        },
        {
          name: "Social Media",
          value: member.socials
            .map((s) => `[${s.title}](${s.url})`)
            .join(" | "),
          inline: false,
        }
      )
      .setColor("#ff0000")
      .setFooter({text: `Detail Member | ${member.name}`});

    await interaction.editReply({
      content: null,
      embeds: [embed],
      components: [],
    });
  }
}

module.exports = {data, run, handleSelect};
