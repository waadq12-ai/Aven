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

        // جلب آخر الرسائل في القناة وتنظيف الرسائل القديمة للبوت عشان يرسل الشكل الجديد النظيف
        const messages = await channel.messages.fetch({ limit: 10 });
        const botMessages = messages.filter(m => m.author.id === client.user.id);
        
        // حذف رسائل البوت القديمة عشان ما يصير فيه ازدحام وتظهر القائمة الجديدة فقط
        for (const msg of botMessages.values()) {
            await msg.delete().catch(() => {});
        }

        const embed = new EmbedBuilder()
            .setColor(0x2b2d31) // لون ديسكورد الداكن الاحترافي
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
            // إذا حابة تضيفين صورة مصغرة، حطي رابطها هنا بين القوسين:
            // .setThumbnail('رابط_الصورة')
            // إذا حابة تضيفين بنر كبير، حطي رابطها هنا:
            // .setImage('رابط_البنر')
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

        if (ticketType === 'support_ticket') {
            channelName = `support-${member.user.username}`;
            welcomeDescription = `أهلاً بك يا ${member} في قسم **الدعم الفني**.\n\nيرجى شرح مشكلتك أو استفسارك بكل تفصيل لكي يتمكن الفريق من خدمتك بالشكل المطلوب.`;
        } else if (ticketType === 'complaint_ticket') {
            channelName = `complaint-${member.user.username}`;
            welcomeDescription = `أهلاً بك يا ${member} في قسم **الشكاوى والبلاغات**.\n\nيرجى كتابة تفاصيل الشكوى مع إرفاق الأدلة (صور أو روابط) إن وجدت، وستتم معالجة طلبك بسرية تامة.`;
        } else if (ticketType === 'staff_ticket') {
            channelName = `staff-${member.user.username}`;
            welcomeDescription = `أهلاً بك يا ${member} في **تقديم الإشراف**.\n\nيرجى تعبئة النموذج التالي وإرساله هنا:\n• العمر:\n• الخبرة الإدارية السابقة:\n• لماذا ترغب بالانضمام إلينا؟:`;
        } else if (ticketType === 'suggestion_ticket') {
            channelName = `suggestion-${member.user.username}`;
            welcomeDescription = `أهلاً بك يا ${member} في قسم **الاقتراحات**.\n\nنحن نسعى دائماً للأفضل، تفضل بكتابة اقتراحك وسنأخذه بعين الاعتبار!`;
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
                .setColor(0x5865F2)
                .setTitle('🎫 | تذكرة جديدة مفتوحة')
                .setDescription(welcomeDescription)
                .setFooter({ text: 'يرجى الالتزام بقوانين السيرفر أثناء التواجد هنا' })
                .setTimestamp();

            await ticketChannel.send({ embeds: [welcomeEmbed], components: [closeButton] });
            await interaction.editReply({ content: `✅ تم إنشاء تذكرتك بنجاح: ${ticketChannel}` });
        } catch (error) {
            console.error('خطأ أثناء إنشاء قناة التذكرة:', error);
            await interaction.editReply({ content: '❌ حدث خطأ أثناء إنشاء التذكرة، حاول مرة أخرى.' });
        }
    }

    if (interaction.isButton() && interaction.customId === 'close_ticket') {
        await interaction.reply({ content: '🔒 جاري إغلاق التذكرة وحذف القناة...', ephemeral: true });
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

