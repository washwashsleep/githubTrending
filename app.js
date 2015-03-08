/*
 * require node modules
 */
var express = require('express');
var app = express();
var async = require('async');
var request = require('request');
var cheerio = require('cheerio');
var _ = require('lodash');

/*
 * settings
 */
var trendingUrl = 'https://github.com/trending';


/*
 * routes
 */
app.get('/trending', function(req, res){

    var $;

    async.waterfall([

        function (cb){
            request(trendingUrl, cb);
        },

        function (response, body, cb){

            var output = [];

            $ = cheerio.load(body);

            $('.repo-list-item').each(function (i, elem){

                var title = $(this).find('.repo-list-name').find('a')
                    .text().trim().replace(/(\r\n|\n|\r|\s)/g,'');
                
                var owner = $(this).find('.repo-list-name').find('.prefix').text().trim();
                
                var description = $(this).find('.repo-list-description').text()
                    .trim().replace(/(\r\n|\n|\r)/g,'');

                var url = $(this).find('.repo-list-name').find('a').attr('href');

                var infoArr = $(this).find('.repo-list-meta')
                    .text().trim().replace(/(\r\n|\n|\r|\s)/g,'').split('•');

                var starts = infoArr[1].match(/^([0-9]+)/) ? 
                    parseInt(infoArr[1].match(/^([0-9]+)/)[0], 10) : 0;
                
                output.push({
                    title: title,
                    description: description,
                    url: url,
                    owner: owner,
                    language: infoArr[0],
                    starts: starts,
                });
            });

            cb(null, output);
        }

    ], function (err, output){
        
        if(err){
            return res.json(err);
        }

        res.json(output);
    });
});

app.listen(3000);