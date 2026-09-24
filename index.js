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

// الأيدي الخاص بقناة إرسال قائمة التذاكر
const TICKET_CHANNEL_ID = '1552240348280000594';

// أيدي الكتيجوري (help+) المخصص لتنفتح تحته التذاكر المفتوحة والمغلقة
const TICKET_CATEGORY_ID = '1552219561468891238';

client.once('ready', async () => {
    console.log(`Logged in as ${client.user.tag}!`);

    try {
        const channel = await client.channels.fetch(TICKET_CHANNEL_ID);
        if (!channel) return;

        // تنظيف الرسائل القديمة للبوت عشان ما تتكرر القائمة وتظهر الرسالة الجديدة الفخمة
        const messages = await channel.messages.fetch({ limit: 10 });
        const botMessages = messages.filter(m => m.author.id === client.user.id);
        
        for (const msg of botMessages.values()) {
            await msg.delete().catch(() => {});
        }

        const embed = new EmbedBuilder()
            .setColor(0x2b2d31)
            .setTitle('🌟 | مركز الخدمة والدعم الرسمي')
            .setDescription(
                'مرحباً بك في سيرفرنا!\n\n' +
                'حرصاً منا على راحتكم وتقديم أفضل تجربة، يرجى اختيار القسم المناسب من القائمة أدناه لفتح **تذكرة خاصة** وسيتواصل معك فريق الإدارة في أقرب وقت ممكن.\n\n' +
                '```ansi\n\u001b[33m⚠️ ملاحظة: يرجى عدم فتح تذكرة بدون سبب حقيقي لكي لا تتعرض للعقوبة.\u001b[0m\n```'
            )
            .addFields(
                { name: '🛠️ | الدعم الفني', value: 'حل المشاكل التقنية والاستفسارات العامة.', inline: true },
                { name: '⚠️ | الشكاوى', value: 'الإبلاغ عن الأعضاء أو المشاكل.', inline: true },
                { name: '🛡️ | تقديم الإشراف', value: 'الانضمام لفريق الإدارة.', inline: true },
                { name: '💡 | الاقتراحات', value: 'طرح أفكار لتطوير السيرفر.', inline: true }
            )
            .setFooter({ text: 'نظام التذاكر المطور • جميع الحقوق محفوظة', iconURL: client.user.displayAvatarURL() })
            .setTimestamp();

        const row = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('ticket_select')
                .setPlaceholder('📌 اضغط هنا لاختيار القسم المطلوب...')
                .addOptions([
                    {
                        label: 'الدعم الفني والاستفسارات',
                        description: 'لحل أي مشكلة تقنية تواجهك',
                        value: 'support_ticket',
                        emoji: '🛠️'
                    },
                    {
                        label: 'الشكاوى والبلاغات',
                        description: 'لتقديم شكوى رسمية أو بلاغ',
                        value: 'complaint_ticket',
                        emoji: '⚠️'
                    },
                    {
                        label: 'تقديم على الإشراف',
                        description: 'انضم إلينا وكن جزءاً من فريق العمل',
                        value: 'staff_ticket',
                        emoji: '🛡️'
                    },
                    {
                        label: 'الاقتراحات والآراء',
                        description: 'شاركنا برأيك لتطوير السيرفر للأفضل',
                        value: 'suggestion_ticket',
                        emoji: '💡'
                    }
                ])
        );

        await channel.send({ embeds: [embed], components: [row] });
        console.log('✅ تم إرسال قائمة التذاكر بنجاح في القناة المحددة.');
    } catch (error) {
        console.error('❌ خطأ أثناء إرسال قائمة التذاكر:', error);
    }
});

client.on('interactionCreate', async interaction => {
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
            // إنشاء القناة باسم t-username وتحت كتيجوري help+ مباشرة
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

    if (interaction.isButton() && interaction.customId === 'close_ticket') {
        const member = interaction.member;
        const channel = interaction.channel;

        await interaction.reply({ content: '🔒 تم إغلاق التذكرة بنجاح. سيتم سحب صلاحيات الرؤية عن العضو، و**سيتم حذف هذه القناة نهائياً تلقائياً بعد 24 ساعة (يوم كامل)**.', ephemeral: false });

        try {
            // سحب صلاحية رؤية القناة عن العضو وإبقائها للإدارة تحت نفس الكتيجوري
            await channel.permissionOverwrites.edit(member.id, {
                ViewChannel: false
            });
            
            // تغيير اسم القناة لتصبح واضحة أنها مغلقة
            await channel.setName(`closed-${channel.name}`).catch(() => {});

            // جدول الحذف التلقائي بعد يوم كامل (24 ساعة = 86400000 ملي ثانية)
            setTimeout(async () => {
                try {
                    if (channel) {
                        await channel.delete();
                    }
                } catch (err) {
                    console.error('القناة ربما تم حذفها مسبقاً:', err);
                }
            }, 24 * 60 * 60 * 1000);

        } catch (error) {
            console.error('خطأ أثناء معالجة إغلاق التذكرة:', error);
        }
    }
});

client.login(process.env.TOKEN);
