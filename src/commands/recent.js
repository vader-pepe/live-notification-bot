// Import library yang diperlukan
const axios = require("axios");
const config = require("../main/config");
const {
  SlashCommandBuilder,
  StringSelectMenuBuilder,
  ActionRowBuilder,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");

const data = new SlashCommandBuilder()
  .setName("recent")
  .setDescription("Menampilkan data recent live member.");

const formatTimeWithAMPM = (date) => {
  const hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const ampm = hours < 12 ? "AM" : "PM";
  const formattedHours = hours % 12 || 12;
  return `${formattedHours}:${minutes} ${ampm}`;
};

async function run({interaction}) {
  try {
    const response = await axios.get(
      `${config.ipAddress}:${config.port}/api/recent-live`
    );
    const liveData = response.data;

    // Fungsi untuk membuat embed awal (menampilkan semua member)
    const createInitialEmbed = () => {
      return new EmbedBuilder()
        .setTitle("Recent Live Members")
        .setDescription("Berikut adalah daftar recent live members JKT48.")
        .addFields(
          liveData.map((live) => {
            const name = live.member?.name || "N/A"; // Berikan nilai default jika name tidak ada
            const createdDate = new Date(live.created_at);
            const duration = (live.live_info?.duration / 60000).toFixed(2); // Hitung durasi dalam menit

            return {
              name: name,
              value: `📅 ${createdDate.toLocaleString("id-ID", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
              })}\n🕛 ${formatTimeWithAMPM(
                createdDate
              )}\n⏱️ ${duration} menit\n📺 **${live.type.toUpperCase()}**`,
              inline: true,
            };
          })
        )
        .setColor("#FF0000");
    };

    // Fungsi untuk membuat dropdown menu
    const createDropdownMenu = () => {
      return new StringSelectMenuBuilder()
        .setCustomId("select_member")
        .setPlaceholder("Pilih member untuk melihat detail")
        .addOptions(
          liveData
            .filter((live) => {
              // Check if nickname exists and is a string before calling includes
              return (
                live.member.nickname &&
                typeof live.member.nickname === "string" &&
                !live.member.nickname.includes("JKT48 Official SHOWROOM")
              );
            })
            .map((live) => ({
              label: live.member.nickname,
              value: live.data_id,
              description: `Live pada ${new Date(
                live.created_at
              ).toLocaleString("id-ID", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
              })} ${formatTimeWithAMPM(new Date(live.created_at))}`,
            }))
        );
    };

    const createDetailEmbed = (detailData) => {
      if (
        !detailData ||
        !detailData.live_info ||
        !detailData.live_info.date ||
        !detailData.live_info.date.start ||
        !detailData.live_info.date.end
      ) {
        return new EmbedBuilder()
          .setTitle("Error")
          .setDescription("Data detail tidak tersedia.")
          .setColor("#FF0000");
      }

      const startDate = new Date(detailData.live_info.date.start);
      const endDate = new Date(detailData.live_info.date.end);

      const generation = detailData.room_info.generation;
      const formattedGeneration = generation
        .replace("gen", "Gen ")
        .split("-")[0];

      let imageUrl;
      if (detailData.type === "showroom") {
        imageUrl = detailData.room_info.img;
      } else if (detailData.type === "idn") {
        imageUrl = detailData.idn.image;
      } else {
        imageUrl = "";
      }

      return new EmbedBuilder()
        .setTitle(`Detail Live - ${detailData.room_info.nickname}`)
        .setImage(imageUrl)
        .addFields(
          {name: "Nama", value: detailData.room_info.name, inline: false},
          {
            name: "Jikosokai",
            value: detailData.room_info.jikosokai.toString(),
            inline: false,
          },
          {
            name: "Generasi",
            value: formattedGeneration,
            inline: true,
          },
          {
            name: "Start Live",
            value: formatTimeWithAMPM(startDate),
            inline: true,
          },
          {
            name: "End Live",
            value: formatTimeWithAMPM(endDate),
            inline: true,
          },
          {
            name: "Durasi",
            value: `${(detailData.live_info.duration / 60000).toFixed(
              2
            )} menit`,
            inline: true,
          },
          {
            name: "Viewers",
            value: detailData.live_info.viewers.num.toString(),
            inline: true,
          },
          {
            name: "Points",
            value: detailData.total_gifts.toString(),
            inline: true,
          },
          {
            name: "Gift Rate",
            value: detailData.gift_rate.toString(),
            inline: true,
          },
          {
            name: "Total Gifts",
            value: detailData.total_gifts.toString(),
            inline: true,
          },
          {
            name: "Tipe Live",
            value: detailData.type.toUpperCase(),
            inline: true,
          }
        )
        .setColor("#FF0000");
    };

    const createBackButton = () => {
      return new ButtonBuilder()
        .setCustomId("back_to_initial")
        .setLabel("Kembali")
        .setStyle(ButtonStyle.Danger);
    };

    const createLinkButton = (detailData) => {
      return new ButtonBuilder()
        .setLabel("Lebih Detail Disini")
        .setStyle(ButtonStyle.Link)
        .setURL(`https://48intens.com/recentlive/${detailData.data_id}`);
    };

    const initialEmbed = createInitialEmbed();
    const dropdownMenu = createDropdownMenu();
    const row = new ActionRowBuilder().addComponents(dropdownMenu);

    await interaction.reply({
      embeds: [initialEmbed],
      components: [row],
      ephemeral: true,
    });

    const filter = (i) =>
      (i.customId === "select_member" || i.customId === "back_to_initial") &&
      i.user.id === interaction.user.id;
    const collector = interaction.channel.createMessageComponentCollector({
      filter,
      time: 60000,
    });

    collector.on("collect", async (i) => {
      if (i.customId === "select_member") {
        const dataId = i.values[0];
        const detailResponse = await axios.get(
          `${config.ipAddress}:${config.port}/api/recent-live/${dataId}`
        );
        const detailData = detailResponse.data;

        if (detailData) {
          const detailEmbed = createDetailEmbed(detailData);
          const backButton = createBackButton();
          const linkButton = createLinkButton(detailData);
          const buttonRow = new ActionRowBuilder().addComponents([
            backButton,
            linkButton,
          ]);

          await i.update({embeds: [detailEmbed], components: [buttonRow]});
        }
      } else if (i.customId === "back_to_initial") {
        const initialEmbed = createInitialEmbed();
        const dropdownMenu = createDropdownMenu();
        const row = new ActionRowBuilder().addComponents(dropdownMenu);

        await i.update({embeds: [initialEmbed], components: [row]});
      }
    });

    collector.on("end", (collected) => {
      if (collected.size === 0) {
        interaction.editReply({
          content: "Waktu pemilihan habis.",
          components: [],
        });
      }
    });
  } catch (error) {
    console.error("Error fetching recent live data:", error);
    await interaction.reply({
      content: "Terjadi kesalahan saat mengambil data recent live.",
      ephemeral: true,
    });
  }
}

module.exports = {data, run};
