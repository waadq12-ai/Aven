const { 
    Client, 
    GatewayIntentBits, 
    ActionRowBuilder, 
    StringSelectMenuBuilder, 
    EmbedBuilder, 
    ChannelType, 
    PermissionFlagsBits,
    ButtonBuilder,
    ButtonStyle,
    REST,
    Routes,
    SlashCommandBuilder
} = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// أيدي الكتيجوري (help+) المخصص لتنفتح تحته التذاكر
const TICKET_CATEGORY_ID = '1552219561468891238';

client.once('ready', async () => {
    console.log(`Logged in as ${client.user.tag}!`);

    // تسجيل أمر السلاش تلقائياً
    const commands = [
        new SlashCommandBuilder()
            .setName('setup')
            .setDescription('إرسال قائمة نظام التذاكر الرسمية')
    ];

    const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

    try {
        await rest.put(
            Routes.applicationCommands(client.user.id),
            { body: commands },
        );
        console.log('✅ تم تسجيل أمر السلاش (/setup) بنجاح.');
    } catch (error) {
        console.error('خطأ في تسجيل الأوامر:', error);
    }
});

client.on('interactionCreate', async interaction => {
    // أمر السلاش /setup
    if (interaction.isChatInputCommand() && interaction.commandName === 'setup') {
        const embed = new EmbedBuilder()
            .setColor(0x2b2d31)
            .setTitle('مركز خدمات الدعم والتذاكر الرسمية')
            .setDescription(
                'عزيزي العضو،\n' +
                'حرصاً منا على ضمان تقديم أعلى معايير الجودة وسرعة الاستجابة لطلباتكم، يرجى تحديد القسم المختص أدناه من القائمة المنسدلة لفتح تذكرة دعم خاصة.\n\n' +
                'نحيطكم علماً بأن كافة البيانات والمعاملات تتمتع بسرية تامة.\n\n' +
                '---'
            )
            .setFooter({ text: 'نظام إدارة السيرفرات الرسمي • جميع الحقوق محفوظة', iconURL: client.user.displayAvatarURL() })
            .setTimestamp();

        const row = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('ticket_select')
                .setPlaceholder('اختر القسم المختص لفتح التذكرة...')
                .addOptions([
                    {
                        label: 'الدعم الفني والاستفسارات',
                        description: 'لمعالجة الأعطال التقنية والاستفسارات العامة',
                        value: 'support_ticket',
                        emoji: '🛠️'
                    },
                    {
                        label: 'الشكاوى والبلاغات',
                        description: 'لتقديم الشكاوى الرسمية والإبلاغ عن المخالفات',
                        value: 'complaint_ticket',
                        emoji: '⚠️'
                    },
                    {
                        label: 'تقديم على الإشراف',
                        description: 'لاستقبال طلبات الانضمام لطاقم الإدارة',
                        value: 'staff_ticket',
                        emoji: '🛡️'
                    },
                    {
                        label: 'الاقتراحات والتطوير',
                        description: 'لاستقبال الأفكار والمقترحات البناءة',
                        value: 'suggestion_ticket',
                        emoji: '💡'
                    }
                ])
        );

        await interaction.reply({ embeds: [embed], components: [row] });
    }

    // التعامل مع اختيار القائمة لفتح التذكرة
    if (interaction.isStringSelectMenu() && interaction.customId === 'ticket_select') {
        const ticketType = interaction.values[0];
        const guild = interaction.guild;
        const member = interaction.member;

        await interaction.deferReply({ ephemeral: true });

        let welcomeDescription = '';

        if (ticketType === 'support_ticket') {
            welcomeDescription = `أهلاً بك يا ${member} في قسم **الدعم الفني**.\n\nيرجى شرح مشكلتك أو استفسارك بكل تفصيل لكي يتمكن الفريق من خدمتك بالشكل المطلوب.`;
        } else if (ticketType === 'complaint_ticket') {
            welcomeDescription = `أهلاً بك يا ${member} في قسم **الشكاوى والبلاغات**.\n\nيرجى كتابة تفاصيل الشكوى مع إرفاق الأدلة (صور أو روابط) إن وجدت، وستتم معالجة طلبك بسرية تامة.`;
        } else if (ticketType === 'staff_ticket') {
            welcomeDescription = `أهلاً بك يا ${member} في **تقديم الإشراف**.\n\nيرجى تعبئة النموذج التالي وإرساله هنا:\n• العمر:\n• الخبرة الإدارية السابقة:\n• لماذا ترغب بالانضمام إلينا؟:`;
        } else if (ticketType === 'suggestion_ticket') {
            welcomeDescription = `أهلاً بك يا ${member} في قسم **الاقتراحات**.\n\nنحن نسعى دائماً للأفضل، تفضل بكتابة اقتراحك وسنأخذه بعين الاعتبار!`;
        }

        try {
            // إنشاء القناة باسم t-username وتحت كتيجوري help+
            const ticketChannel = await guild.channels.create({
                name: `t-${member.user.username}`,
                type: ChannelType.GuildText,
                parent: TICKET_CATEGORY_ID,
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
                .setColor(0x5865F2)
                .setTitle('🎫 | تذكرة جديدة مفتوحة')
                .setDescription(welcomeDescription)
                .setFooter({ text: 'يرجى الالتزام بقوانين السيرفر أثناء التواجد هنا' })
                .setTimestamp();

            await ticketChannel.send({ embeds: [welcomeEmbed], components: [closeButton] });
            await interaction.editReply({ content: `✅ تم إنشاء تذكرتك بنجاح: ${ticketChannel}` });
        } catch (error) {
            console.error('خطأ أثناء إنشاء قناة التذكرة:', error);
            await interaction.editReply({ content: '❌ حدث خطأ أثناء إنشاء التذكرة، تأكد من صلاحيات البوت.' });
        }
    }

    // زر إغلاق التذكرة
    if (interaction.isButton() && interaction.customId === 'close_ticket') {
        const member = interaction.member;
        const channel = interaction.channel;

        await interaction.reply({ content: '🔒 تم إغلاق التذكرة بنجاح. سيتم سحب صلاحيات الرؤية عن العضو، و**سيتم حذف هذه القناة نهائياً تلقائياً بعد 24 ساعة (يوم كامل)**.', ephemeral: false });

        try {
            await channel.permissionOverwrites.edit(member.id, {
                ViewChannel: false
            });
            
            await channel.setName(`closed-${channel.name}`).catch(() => {});

            // الحذف التلقائي بعد 24 ساعة
            setTimeout(async () => {
                try {
                    if (channel) {
                        await channel.delete();
                    }
                } catch (err) {
                    console.error('القناة حُذفت مسبقاً:', err);
                }
            }, 24 * 60 * 60 * 1000);

        } catch (error) {
            console.error('خطأ أثناء إغلاق التذكرة:', error);
        }
    }
});

client.login(process.env.TOKEN);
