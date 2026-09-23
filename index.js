const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle, ChannelType, PermissionFlagsBits } = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ]
});

// هنا ضع آيدي القنوات أو الفئات المخصصة لكل قسم عندك في السيرفر
const TICKET_CONFIG = {
    general_support: 'ضع_آيدي_روم_الدعم_العام_هنا',
    report_support: 'ضع_آيدي_روم_البلاغات_هنا',
    suggestions_support: 'ضع_آيدي_روم_الاقتراحات_هنا',
    staff_application: 'ضع_آيدي_روم_تقديم_الإدارة_هنا'
};

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag} and ready for tickets!`);
});

// أمر إرسال لوحة التذاكر (اكتب في ديسكورد !setup-tickets للإرسال)
client.on('messageCreate', async message => {
    if (message.content === '!setup-tickets' && message.member.permissions.has(PermissionFlagsBits.Administrator)) {
        
        // 1. تصميم التضمين (Embed) الفخم والغامق لهوية Aven
        const embed = new EmbedBuilder()
            .setTitle('⚙️ · Aven Core — مركز الدعم والخدمات')
            .setDescription('أهلاً بك في نظام الإدارة والدعم الفني لسيرفر **Aven**.\n\nيرجى اختيار القسم المناسب من القائمة بالأسفل لفتح طلبك، وسيتولى فريق العمل خدمتك في أقرب وقت.')
            .setColor('#2F3136'); // لون مينيمال غامق

        // 2. القائمة المنسدلة للأقسام الأربعة
        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('ticket_menu')
            .setPlaceholder('⚙️ · اختر القسم المناسب لطلبك...')
            .addOptions([
                {
                    label: 'مساعدة عامة',
                    description: 'للاستفسارات العامة والمساعدة في السيرفر',
                    value: 'general_support',
                    emoji: '🛟'
                },
                {
                    label: 'بلاغ أو شكوى',
                    description: 'للإبلاغ عن مشكلة أو مخالفة عضو',
                    value: 'report_support',
                    emoji: '⚠️'
                },
                {
                    label: 'اقتراحات وتطوير',
                    description: 'لتقديم أفكار ومقترحات لتحسين السيرفر',
                    value: 'suggestions_support',
                    emoji: '💡'
                },
                {
                    label: 'تقديم الإدارة',
                    description: 'لتقديم طلب انضمام لفريق الإدارة والاشراف',
                    value: 'staff_application',
                    emoji: '🛡️'
                }
            ]);

        const row = new ActionRowBuilder().addComponents(selectMenu);

        await message.channel.send({ embeds: [embed], components: [row] });
        await message.delete().catch(() => {});
    }
});

// 3. التعامل مع اختيار المستخدم من القائمة
client.on('interactionCreate', async interaction => {
    if (!interaction.isStringSelectMenu()) return;
    if (interaction.customId === 'ticket_menu') {
        const selectedValue = interaction.values[0];
        const member = interaction.member;
        const guild = interaction.guild;

        await interaction.deferReply({ ephemeral: true });

        try {
            const targetChannelId = TICKET_CONFIG[selectedValue];
            const targetChannel = guild.channels.cache.get(targetChannelId);

            if (!targetChannel) {
                return await interaction.editReply({ content: '⚠️ عذراً، قناة هذا القسم غير مرتبطة بشكل صحيح في الكود.', ephemeral: true });
            }

            const notificationEmbed = new EmbedBuilder()
                .setTitle('طلب جديد عبر نظام Aven')
                .setDescription(`• **القسم:** ${selectedValue}\n• **صاحب الطلب:** <@${member.id}>\n• **الحالة:** بانتظار المراجعة.`)
                .setColor('#2F3136');

            const closeButton = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('close_ticket')
                    .setLabel('إغلاق / أرشيف الطلب')
                    .setStyle(ButtonStyle.Danger)
                    .setEmoji('🔒')
            );

            await targetChannel.send({
                content: `<@${member.id}> تم استلام طلبك بنجاح.`,
                embeds: [notificationEmbed],
                components: [closeButton]
            });

            await interaction.editReply({ content: `تم إرسال طلبك بنجاح إلى ${targetChannel}`, ephemeral: true });
        } catch (error) {
            console.error(error);
            await interaction.editReply({ content: 'حدث خطأ أثناء معالجة طلبك.', ephemeral: true });
        }
    }

    // زر إغلاق الطلب
    if (interaction.isButton() && interaction.customId === 'close_ticket') {
        await interaction.reply({ content: 'جاري إغلاق وتأشير الطلب...', ephemeral: true });
        setTimeout(async () => {
            await interaction.message.delete().catch(() => {});
        }, 2000);
    }
});

// ضع توكن بوتك هنا أو داخل ملف إعدادات سري
client.login('YOUR_BOT_TOKEN');

