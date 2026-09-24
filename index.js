const { 
    Client, 
    GatewayIntentBits, 
    ActionRowBuilder, 
    StringSelectMenuBuilder, 
    EmbedBuilder, 
    ChannelType, 
    PermissionFlagsBits,
    ButtonBuilder,
    ButtonStyle 
} = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// الأيدي الخاص بالقناة المطلوبة لإرسال قائمة التذاكر الدائمة
const TICKET_CHANNEL_ID = '1552240348280000594';

client.once('ready', async () => {
    console.log(`Logged in as ${client.user.tag}!`);

    try {
        const channel = await client.channels.fetch(TICKET_CHANNEL_ID);
        if (!channel) return;

        // التحقق من الرسائل السابقة لمنع تكرار القائمة
        const messages = await channel.messages.fetch({ limit: 10 });
        const existingMessage = messages.find(m => m.author.id === client.user.id && m.components.length > 0);

        if (!existingMessage) {
            const embed = new EmbedBuilder()
                .setTitle('🎫 مركز الدعم والتذاكر')
                .setDescription('مرحباً بك في سيرفرنا! يرجى اختيار القسم المناسب لك من القائمة أدناه لفتح تذكرة خاصة وسيتم خدمتك في أقرب وقت:')
                .setColor(0x5865F2)
                .setFooter({ text: 'نظام التذاكر الرسمي' })
                .setTimestamp();

            const row = new ActionRowBuilder().addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('ticket_select')
                    .setPlaceholder('اضغط هنا لاختيار القسم المناسب...')
                    .addOptions([
                        {
                            label: 'الدعم الفني',
                            description: 'لحل المشاكل التقنية والاستفسارات العامة',
                            value: 'support_ticket',
                            emoji: '🛠️'
                        },
                        {
                            label: 'الشكاوى والبلاغات',
                            description: 'لتقديم شكوى أو الإبلاغ عن مشكلة',
                            value: 'complaint_ticket',
                            emoji: '⚠️'
                        },
                        {
                            label: 'تقديم على الإشراف',
                            description: 'الانضمام لفريق الإدارة وطرح معلوماتك',
                            value: 'staff_ticket',
                            emoji: '🛡️'
                        },
                        {
                            label: 'الاقتراحات والآراء',
                            description: 'تقديم أفكار واقتراحات لتطوير السيرفر',
                            value: 'suggestion_ticket',
                            emoji: '💡'
                        }
                    ])
            );

            await channel.send({ embeds: [embed], components: [row] });
        }
    } catch (error) {
        console.error('خطأ أثناء إرسال قائمة التذاكر:', error);
    }
});

client.on('interactionCreate', async interaction => {
    if (interaction.isStringSelectMenu() && interaction.customId === 'ticket_select') {
        const ticketType = interaction.values[0];
        const guild = interaction.guild;
        const member = interaction.member;

        await interaction.deferReply({ ephemeral: true });

        let channelName = 't';
        let welcomeDescription = '';

        // تخصيص اسم القناة والرسالة الترحيبية لكل قسم
        if (ticketType === 'support_ticket') {
            channelName = `support-${member.user.username}`;
            welcomeDescription = `أهلاً بك يا ${member} في قسم **الدعم الفني**.\nيرجى توضيح مشكلتك أو استفسارك بالتفصيل وسيقوم الفريق بمساعدتك قريباً.`;
        } else if (ticketType === 'complaint_ticket') {
            channelName = `complaint-${member.user.username}`;
            welcomeDescription = `أهلاً بك يا ${member} في قسم **الشكاوى والبلاغات**.\nيرجى كتابة تفاصيل الشكوى مع إرفاق الأدلة إن وجدت، وستتم معاملتها بسرية تامة.`;
        } else if (ticketType === 'staff_ticket') {
            channelName = `staff-apply-${member.user.username}`;
            welcomeDescription = `أهلاً بك يا ${member} في **تقديم الإشراف**.\nيرجى إرسال نموذج التقديم التالي:\n- العمر:\n- لماذا تريد الانضمام للإدارة؟:\n- خبرتك السابقة:`;
        } else if (ticketType === 'suggestion_ticket') {
            channelName = `suggestion-${member.user.username}`;
            welcomeDescription = `أهلاً بك يا ${member} في قسم **الاقتراحات**.\nنحن نحرص على تطوير السيرفر، شاركنا باقتراحك وسنقوم بدراسته بكل سرور!`;
        }

        try {
            const ticketChannel = await guild.channels.create({
                name: channelName,
                type: ChannelType.GuildText,
                permissionOverwrites: [
                    {
                        id: guild.id,
                        denied: [PermissionFlagsBits.ViewChannel],
                    },
                    {
                        id: member.id,
                        allowed: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory],
                    },
                ],
            });

            const closeButton = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('close_ticket')
                    .setLabel('إغلاق التذكرة')
                    .setStyle(ButtonStyle.Danger)
                    .setEmoji('🔒')
            );

            const welcomeEmbed = new EmbedBuilder()
                .setTitle('🎫 تفاصيل التذكرة')
                .setDescription(welcomeDescription)
                .setColor(0x5865F2)
                .setTimestamp();

            await ticketChannel.send({ embeds: [welcomeEmbed], components: [closeButton] });
            await interaction.editReply({ content: `تم إنشاء تذكرتك بنجاح: ${ticketChannel}` });
        } catch (error) {
            console.error('خطأ أثناء إنشاء قناة التذكرة:', error);
            await interaction.editReply({ content: 'حدث خطأ أثناء إنشاء التذكرة، حاول مرة أخرى.' });
        }
    }

    if (interaction.isButton() && interaction.customId === 'close_ticket') {
        await interaction.reply({ content: 'جاري إغلاق التذكرة وحذف القناة...', ephemeral: true });
        setTimeout(async () => {
            try {
                await interaction.channel.delete();
            } catch (error) {
                console.error('خطأ أثناء حذف القناة:', error);
            }
        }, 3000);
    }
});

client.login(process.env.TOKEN);
