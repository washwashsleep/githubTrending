/*
 * require node modules
 */
var express = require('express');
var app = express();
var async = require('async');
var request = require('request');
var cheerio = require('cheerio');
var _ = require('lodash');
var CronJob = require('cron').CronJob;

/*
 * settings
 */
var trendingUrl = 'https://github.com/trending';

var getData = function (next){

    var $;

    async.waterfall([

        function (cb){

            request(trendingUrl, cb);
        },

        function (response, body, cb){

            var output = [];

            $ = cheerio.load(body);

            $('.repo-list-item').each(function (i, elem){

                if(i > 10){
                    return;
                }

                var title = $(this).find('.repo-list-name').find('a')
                    .text().trim().replace(/(\r\n|\n|\r|\s)/g,'');
                
                var owner = $(this).find('.repo-list-name').find('.prefix').text().trim();
                
                var description = $(this).find('.repo-list-description').text()
                    .trim().replace(/(\r\n|\n|\r)/g,'');

                var url = $(this).find('.repo-list-name').find('a').attr('href');

                var dataArr = {
                    language: '',
                    starts: 0
                };

                var infoArr = $(this).find('.repo-list-meta')
                    .text().trim().replace(/(\r\n|\n|\r|\s)/g,'').split('•');

                if(infoArr.length < 3){
                    dataArr.starts = infoArr[0].match(/^([0-9]+)/) ? 
                    parseInt(infoArr[0].match(/^([0-9]+)/)[0], 10) : 0;
                }else{
                    dataArr.language = infoArr[0];
                    dataArr.starts = infoArr[1].match(/^([0-9]+)/) ? 
                    parseInt(infoArr[1].match(/^([0-9]+)/)[0], 10) : 0;
                }
                
                output.push({
                    title: title,
                    description: description,
                    url: url,
                    owner: owner,
                    language: dataArr.language,
                    starts: dataArr.starts
                });
            });

            cb(null, output);
        }

    ], function (err, output){
        
        if(err){
            console.log('------------ error ------------');
            console.log(err);
            console.log('------------ error ------------');
        }

        if(!output){
            console.log('------------ error ------------');
            console.log('Output not found');
            console.log('------------ error ------------');
        }

        outputData = output;

        if(next && (next instanceof Function)){
            next();
        }
    });

};

var dately = new CronJob({
  cronTime: '* */30 * * * *',
  onTick: function() {
    console.log('outputData update');
    getData();
  },
  start: true,
  timeZone: 'America/Los_Angeles'
});

dately.start();


var outputData = null;


/*
 * routes
 */
app.get('/trending', function (req, res){

    async.waterfall([

        function (cb){

            if(outputData){
                console.log('--------- info ---------');
                console.log('OutputData Alive');
                console.log('--------- info ---------');
                return cb();
            }

            console.log('--------- info ---------');
            console.log('Get Data');
            console.log('--------- info ---------');
            getData(cb);
        },

    ], function (err){
        
        if(err){
            return res.jsonp({
                error: err.toString()
            });
        }

        if(!outputData){
           return res.jsonp({
                error: new Error('OutputData not found.').toString()
           }); 
        }

        res.jsonp(outputData);
    });
});

app.listen(4040);