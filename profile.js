const { 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    EmbedBuilder 
} = require('discord.js');

const PROFILE_CHANNEL_ID = '1553104338392453140';

const colorRoles = {
    'color_1': '1553109627715981332', 'color_2': '1553109761401290752', 'color_3': '1553109830435082360',
    'color_4': '1553109947519344751', 'color_5': '1553110169997680650', 'color_6': '1553110345873363085',
    'color_7': '1553110488072589332', 'color_8': '1553110600413093958', 'color_9': '1553110719401037866',
    'color_10': '1553110774963114084', 'color_11': '1553111057029927032', 'color_12': '1553111228325306368',
    'color_13': '1553111463919362119', 'color_14': '1553112007492767804', 'color_15': '1553763445885771897',
    'color_16': '1553763746432811048', 'color_17': '1553763968223285388', 'color_18': '1553764171857006592',
    'color_19': '1553764497544577085', 'color_20': '1553764847311781998', 'color_21': '1553765137310294056',
    'color_22': '1553766744563261450', 'color_23': '1553767284907180152', 'color_24': '1553768200267763732',
    'color_25': '1553768874535817398', 'color_26': '1553769069302390825', 'color_27': '1553769238945075341',
    'color_28': '1553769373951332362', 'color_29': '1553769519347146814', 'color_30': '1553769673357656185',
    'color_31': '1553769854677295275', 'color_32': '1553770052275277875', 'color_33': '1553770236849954827',
    'color_34': '1553770399186161837', 'color_35': '1553770552072741037', 'color_36': '1553770738677452800',
    'color_37': '1553770903869857842', 'color_38': '1553771049563328532', 'color_39': '1553771230081982577',
    'color_40': '1553771510802415719', 'color_41': '1553771666939576421', 'color_42': '1553771821202014258',
    'color_43': '1553772017369612441', 'color_44': '1553772239206482032', 'color_45': '1553772360736178296',
    'color_46': '1553772544593764392', 'color_47': '1553772739293090013', 'color_48': '1553772890149752924',
    'color_49': '1553773022345830521', 'color_50': '1553773203585765386', 'color_51': '1553773336876548156'
};

module.exports = (client) => {
    client.on('messageCreate', async message => {
        if (message.author.bot) return;
        if (message.content === '.colors') {
            try {
                const channel = message.channel;

                // 1. بناء الصفحة الثانية (من 26 إلى 51)
                let desc2 = '';
                for (let i = 26; i <= 51; i++) {
                    const rId = colorRoles[`color_${i}`];
                    desc2 += `**${i}.** <@&${rId}>\n`;
                }

                const embed2 = new EmbedBuilder()
                    .setDescription(desc2)
                    .setColor('#2b2d31')
                    .setFooter({ text: 'Aven (2 / 2)' });

                const rows2 = [];
                let currentRow2 = new ActionRowBuilder();
                let count2 = 0;
                for (let i = 26; i <= 51; i++) {
                    currentRow2.addComponents(
                        new ButtonBuilder().setCustomId(`color_${i}`).setLabel(`${i}`).setStyle(ButtonStyle.Secondary)
                    );
                    count2++;
                    if (count2 === 5 || i === 51) {
                        rows2.push(currentRow2);
                        currentRow2 = new ActionRowBuilder();
                        count2 = 0;
                    }
                }

                // إرسال الصفحة الثانية أولاً عشان ناخذ رابطها
                const sentMsg2 = await channel.send({ embeds: [embed2], components: rows2 });

                // 2. بناء الصفحة الأولى (من 1 إلى 25)
                let desc1 = 'اختر لونك واضغط على رقمه لإضافته إلى بروفايلك.\n\n';
                for (let i = 1; i <= 25; i++) {
                    const rId = colorRoles[`color_${i}`];
                    desc1 += `**${i}.** <@&${rId}>\n`;
                }

                const embed1 = new EmbedBuilder()
                    .setTitle('**Choose Your Color**')
                    .setDescription(desc1)
                    .setImage('https://cdn.discordapp.com/attachments/1552241868241240175/1553777179677032668/IMG_0184.jpg?ex=6aba7b43&is=6ab929c3&hm=cc7a9fe7de9d7826e3dc3c87380bca9581e12749489be7d4b0acac7df6590ec9&')
                    .setColor('#2b2d31')
                    .setFooter({ text: 'Aven (1 / 2)' });

                const rows1 = [];
                let currentRow1 = new ActionRowBuilder();
                let count1 = 0;
                for (let i = 1; i <= 25; i++) {
                    currentRow1.addComponents(
                        new ButtonBuilder().setCustomId(`color_${i}`).setLabel(`${i}`).setStyle(ButtonStyle.Secondary)
                    );
                    count1++;
                    if (count1 === 5 || i === 25) {
                        rows1.push(currentRow1);
                        currentRow1 = new ActionRowBuilder();
                        count1 = 0;
                    }
                }

                // إضافة زر التنقل (➡️) في آخر صف للأرقام بالصفحة الأولى (أو بصف جديد لو الصف ممتلئ)
                const lastRow1 = rows1[rows1.length - 1];
                const navButton = new ButtonBuilder()
                    .setEmoji('➡️')
                    .setStyle(ButtonStyle.Link)
                    .setURL(sentMsg2.url);

                if (lastRow1.components.length < 5) {
                    lastRow1.addComponents(navButton);
                } else {
                    rows1.push(new ActionRowBuilder().addComponents(navButton));
                }

                // إرسال الصفحة الأولى
                await channel.send({ embeds: [embed1], components: rows1 });
                await message.delete().catch(() => {});

            } catch (error) {
                console.error('❌ خطأ:', error);
            }
        }
    });

    // تفاعل الأزرار (تغيير اللون وإزالة القديم)
    client.on('interactionCreate', async interaction => {
        if (!interaction.isButton()) return;
        const roleId = colorRoles[interaction.customId];
        if (!roleId) return;

        try {
            const member = interaction.member;
            for (const rId of Object.values(colorRoles)) {
                if (member.roles.cache.has(rId) && rId !== roleId) {
                    await member.roles.remove(rId).catch(() => {});
                }
            }
            await member.roles.add(roleId);
            await interaction.reply({ content: '✨ تم اختيار وتحديث لونك بنجاح!', ephemeral: true });
        } catch (err) {
            console.error(err);
        }
    });
};
