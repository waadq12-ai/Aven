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
                .setTitle('نظام التذاكر')
                .setDescription('اختر نوع التذاكر المناسب لك من القائمة أدناه لفتح تذكرة خاصة:')
                .setColor(0x5865F2);

            const row = new ActionRowBuilder().addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('ticket_select')
                    .setPlaceholder('اختر قسم التذكرة...')
                    .addOptions([
                        {
                            label: 'الدعم الفني',
                            description: 'لحل المشاكل التقنية والاستفسارات',
                            value: 'support_ticket',
                            emoji: '🛠️'
                        },
                        {
                            label: 'الشكاوى',
                            description: 'لتقديم شكوى أو الإبلاغ عن مشكلة',
                            value: 'complaint_ticket',
                            emoji: '⚠️'
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

        try {
            const ticketChannel = await guild.channels.create({
                name: `t-${member.user.username}`,
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
                .setTitle('تذكرة جديدة')
                .setDescription(`مرحباً بك ${member}، تم فتح التذكرة بنجاح. سيتم خدمتك في أقرب وقت.`);

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
