const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ]
});

// روم إرسال لوحة التذاكر (نفس الروم اللي أعطيتني آيديه)
const TICKET_CHANNEL_ID = '1552240348280000594';

client.on('ready', async () => {
    console.log(`Logged in as ${client.user.tag} and ready for tickets!`);

    try {
        const channel = await client.channels.fetch(TICKET_CHANNEL_ID);
        if (!channel) return;

        // التحقق إذا كانت اللوحة مرسلة من قبل عشان ما تتكرر
        const messages = await channel.messages.fetch({ limit: 10 });
        const existingMessage = messages.find(m => m.author.id === client.user.id);

        if (!existingMessage) {
            const embed = new EmbedBuilder()
                .setTitle('⚙️ · Aven Core — مركز الدعم والخدمات')
                .setDescription('أهلاً بك في نظام الإدارة والدعم الفني لسيرفر **Aven**.\n\nيرجى اختيار القسم المناسب من القائمة بالأسفل لفتح طلبك، وسيتولى فريق العمل خدمتك في أقرب وقت.')
                .setColor('#2F3136');

            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId('ticket_menu')
                .setPlaceholder('⚙️ · اختر القسم المناسب لطلبك...')
                .addOptions([
                    { label: 'مساعدة عامة', description: 'للاستفسارات العامة والمساعدة في السيرفر', value: 'general_support', emoji: '🛟' },
                    { label: 'بلاغ أو شكوى', description: 'للإبلاغ عن مشكلة أو مخالفة عضو', value: 'report_support', emoji: '⚠️' },
                    { label: 'اقتراحات وتطوير', description: 'لتقديم أفكار ومقترحات لتحسين السيرفر', value: 'suggestions_support', emoji: '💡' },
                    { label: 'تقديم الإدارة', description: 'لتقديم طلب انضمام لفريق الإدارة والاشراف', value: 'staff_application', emoji: '🛡️' }
                ]);

            const row = new ActionRowBuilder().addComponents(selectMenu);
            await channel.send({ embeds: [embed], components: [row] });
            console.log('Ticket panel sent successfully!');
        }
    } catch (error) {
        console.error('Error sending ticket panel:', error);
    }
});

// التعامل مع اختيار العضو من القائمة وإنشاء روم خاص له أو إشعار الإدارة في نفس الروم
client.on('interactionCreate', async interaction => {
    if (!interaction.isStringSelectMenu()) return;
    if (interaction.customId === 'ticket_menu') {
        const selectedValue = interaction.values[0];
        const member = interaction.member;
        const guild = interaction.guild;

        await interaction.deferReply({ ephemeral: true });

        // خريطة أسماء الأقسام بالعربي عشان تطلع واضحة للمستخدم
        const categoryNames = {
            general_support: 'مساعدة عامة',
            report_support: 'بلاغ أو شكوى',
            suggestions_support: 'اقتراحات وتطوير',
            staff_application: 'تقديم الإدارة'
        };

        const chosenCategory = categoryNames[selectedValue] || 'طلب جديد';

        try {
            // إنشاء روم خاص (تذكرة) للعضو بشكل أوتوماتيكي
            const ticketChannel = await guild.channels.create({
                name: `ticket-${member.user.username}`,
                type: 0, // قناة نصية
                parent: null, // تقدري تحطين آيدي الفئة (Category ID) هنا لو تبينها تنزل تحت قسم معين
                permissionOverwrites: [
                    {
                        id: guild.id,
                        deny: ['ViewChannel'], // منع الجميع من رؤية التذكرة
                    },
                    {
                        id: member.id,
                        allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory'], // السماح لصاحب التذكرة
                    },
                    {
                        id: client.user.id,
                        allow: ['ViewChannel', 'SendMessages', 'ManageChannels'], // السماح للبوت
                    }
                ]
            });

            const ticketEmbed = new EmbedBuilder()
                .setTitle(`⚙️ · تذكرة جديدة: ${chosenCategory}`)
                .setDescription(`أهلاً بك <@${member.id}>.\nتم فتح تذكرتك بنجاح في قسم **${chosenCategory}**.\n\nيرجى كتابة تفاصيل مشكلتك أو طلبك هنا، وسيقوم فريق العمل بالرد عليك قريباً.`)
                .setColor('#2F3136');

            const closeButton = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('close_ticket')
                    .setLabel('إغلاق التذكرة')
                    .setStyle(ButtonStyle.Danger)
                    .setEmoji('🔒')
            );

            await ticketChannel.send({
                content: `<@${member.id}> | <@&آيدي_روم_أو_رتبة_الإدارة>`, // تقدرين تحطين رتبة الإدارة هنا عشان يوصلهم تنبيه
                embeds: [ticketEmbed],
                components: [closeButton]
            });

            await interaction.editReply({ content: `تم إنشاء تذكرتك بنجاح! توجه إلى هنا: ${ticketChannel}`, ephemeral: true });
        } catch (error) {
            console.error(error);
            await interaction.editReply({ content: 'حدث خطأ أثناء إنشاء التذكرة، تأكد من صلاحيات البوت.', ephemeral: true });
        }
    }

    // زر إغلاق التذكرة
    if (interaction.isButton() && interaction.customId === 'close_ticket') {
        await interaction.reply({ content: 'جاري إغلاق وحذف التذكرة خلال 3 ثوانٍ...', ephemeral: true });
        setTimeout(async () => {
            await interaction.channel.delete().catch(() => {});
        }, 3000);
    }
});

client.login('YOUR_BOT_TOKEN');
