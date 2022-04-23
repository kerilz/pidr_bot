const TelegramBot = require('node-telegram-bot-api');
var gaussian = require('gaussian');
var distribution = gaussian(1.8411552, 19.066866);
const db = require("./db");
const Tipok = require("./Tipok");

const token = process.argv[process.argv.indexOf("token") + 1];

const bot = new TelegramBot(token, {polling: true});

db.on("error", (err) => {
    console.log("Error while connecting to the DB:\n " + err);
    throw err;
});

db.once("open", async () => {
    console.log("[Worker with PID " + process.pid + "]: Database connection established");
    let username = await bot.getMe();
    username = username.username;
    bot.username = username;
    console.log(`Bot with username ${username} is initialized`)
});

bot.on('message', async (msg) => {
    if (msg.text === "/pidr" || msg.text === `/pidr@${bot.username}`) {
        Tipok.findOne({userId: msg.from.id, groupId: msg.chat.id}, async (err, tipok) => {
            if (!tipok) {
                const newTipok = new Tipok({
                    name: msg.from.first_name,
                    userId: msg.from.id,
                    length: 0,
                    lastPlayed: 0,
                    groupId: msg.chat.id
                });
                await newTipok.save();
                bot.sendMessage(msg.chat.id, `@${msg.from.username} ти тепер у грі і у тебе немає песюна`);
            } else {
                if (!isToday(tipok.lastPlayed) || tipok.groupId == "-644900140") {
                    const growth = grow(tipok.length);
                    tipok.length = tipok.length + growth;
                    tipok.lastPlayed = new Date();
                    await tipok.save();

                    bot.sendMessage(msg.chat.id, buildMessage(msg.from.username, growth, tipok.length));
                } else {
                    bot.sendMessage(msg.chat.id, `@${msg.from.username}, ти сьогодні вже грав.`)
                }
            }
        });
    } else if (msg.text === "/topdicks" || msg.text === `/topdicks@${bot.username}`) {
        Tipok.find({groupId: msg.chat.id}, async (err, tipki) => {
            let result = "";
            tipki.sort((a, b) => b.length - a.length).forEach((a, i) => {
                result += `${i + 1}. ${a.name} – ${a.length} см.\n`
            });
            bot.sendMessage(msg.chat.id, result);
        })
    }
});

const grow = length => {
    let growth = Math.round(distribution.random(1));
    growth = growth > 10 ? 10 : growth;
    growth = growth < -10 ? -10 : growth;
    growth = growth !== 0 ? growth : growth + 1;
    return growth + length >= 0 ? growth : grow(length)
};

const isToday = date => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear()
};

const timeUntilTomorrow = date => {
    const tomorrowMidnight = new Date(date.getTime() + (24 * 60 * 60 * 1000));
    tomorrowMidnight.setHours(0);
    tomorrowMidnight.setMinutes(0);
    const minutesRaw = (tomorrowMidnight.getTime() - date.getTime()) / (1000 * 60);
    return {hours: Math.floor(minutesRaw / 60), minutes: Math.round(minutesRaw - Math.floor(minutesRaw / 60) * 60)}
};

const buildMessage = (username, growth, length) => {
    const newLengthText = newLength => {
        return newLength === 0 ? `Тепер у тебе немає песюна.` : `Тепер його довжина: ${newLength} см.`
    };
    const {hours, minutes} = timeUntilTomorrow(new Date());
    return `@${username}, твій песюн ${growth > 0 ? "виріс" : "скоротився"} на ${Math.abs(growth)} см. ${newLengthText(length)} Продовжуй грати через ${hours} год., ${minutes} хв.`
};