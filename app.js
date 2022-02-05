require("dotenv").config();

const { Telegraf, Markup }  = require('telegraf');
const TelegrafStatelessQuestion = require('telegraf-stateless-question');
const axios  = require('axios');

const TMDB_TOKEN = process.env.TMDB_TOKEN
const BOT_TOKEN = process.env.BOT_TOKEN

const image_path = `https://image.tmdb.org/t/p/w1280`;
const Url = 'https://api.themoviedb.org/';
const Version = '3';

const bot = new Telegraf(BOT_TOKEN);

bot.start(async (ctx) =>{
    await ctx.replyWithHTML('<b>Hoş geldin dostum.</b>',
        Markup.inlineKeyboard(
        [
            [Markup.button.callback('Ara', 'filmara')]
        ]
    ))
})

const unicornQuestion = new TelegrafStatelessQuestion('unicorns', async ctx => {
    bot.telegram.sendChatAction(ctx.chat.id, "typing");

    let query = ctx.message.text;
    const url = `${Url}${Version}/search/movie?api_key=${TMDB_TOKEN}&query="${query}"`;
    axios
        .get(url)
        .then((res) => {
            const Movie_id = res.data.results[0].id;
            const Movieurl = `${Url}${Version}/movie/${Movie_id}?api_key=${TMDB_TOKEN}&language=tr`;

            axios.get(Movieurl).then((response) => {
                const {
                    title,
                    original_title,
                    original_language,
                    overview,
                    popularity,
                    genres,
                    adult,
                    release_date,
                    runtime,
                    status,
                    vote_average,
                    tagline,
                } = response.data;
                let CompanyName = "";
                let genreArry = [];
                let language = original_language.toUpperCase();
                genres.map((genre) => genreArry.push(genre.name));
                let genreList = genreArry.join(", ");
                let release_year = release_date.slice(0, 4);
                if (response.data.production_companies[0] != undefined) {
                    CompanyName = response.data.production_companies[0].name;
                } else {
                    CompanyName = "N/A";
                }
                let shortOverview = "";
                if (overview.length > 450) {
                    shortOverview = overview.slice(0, 450) + "...";
                } else {
                    shortOverview = overview;
                }
                ctx.replyWithPhoto(
                    {
                        url: image_path + res.data.results[0].poster_path,
                        filename: "movie.jpg",
                    },
                    {
                        caption: `
*${title}* (${original_title}) - ${language}

*➝ Durum:* ${status.toUpperCase()}
*➝ Türler:* \`${genreList}\`
*➝ Yetişkin:* ${adult ? "Evet" : "Hayır"}
*➝ Popülerlik:* ${popularity}
*➝ TMDB Puanı:* ${vote_average}
*➝ Süre:* ${runtime} dakika
*➝ Yayınlanma Zamanı:* ${release_year}
*➝ Üretim Şirketi:* ${CompanyName}
*➝ Etiketi:* ❝ ${tagline ? tagline : "N/A"} ❞
                            
*➝* ${shortOverview}`,
                        parse_mode: "Markdown",
                        reply_to_message_id: ctx.update.message.message_id,
                        reply_markup: {remove_keyboard: true},
                        selective: true
                    }
                );
            });
        })
        .catch((err) =>
            ctx.reply(`${query} İçin Sonuç Bulunamadı :(`, {
                reply_to_message_id: ctx.update.message.message_id,
                reply_markup: {remove_keyboard: true},
                selective: true
            })
        )
})

bot.action('filmara', (ctx) => {
    let text  = 'Bir film adı yaz.'
    ctx.answerCbQuery()
    unicornQuestion.replyWithMarkdown(ctx, text)
})

bot.use(unicornQuestion.middleware())

bot.launch()
