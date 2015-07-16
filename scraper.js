var app = {
	cheerio: require('cheerio'),
	request: require('request'),
	async:   require('async'),
  fs:      require('fs'),
	url: 'http://www.modules.napier.ac.uk/'
};

app.getAlphabetLinks = function(promise) {
	var links = [app.url],
	    link;

	app.request(app.url, function(err, res, html) {
    if (!err && res.statusCode == 200) {
      var $ = app.cheerio.load(html);
      $('.searchAlphabet').first().find('a').each(function(index, $element) {
        link = app.url + $($element).attr('href');
        links.push(link);
      });

      promise(links);
    } else if (err) {
    	throw err;
    }
	});
};

app.getModuleLinks   = function(links, promise) {
  var moduleLinks = [],
      link,
      errors = [];

  var q = app.async.queue(function(url, next) {
		app.request(url, function(err, res, html) {
		  if (!err && res.statusCode == 200) {
		    var $ = app.cheerio.load(html);
		    $('.courseListing ul li a').each(function(index, $element) {
		      link = app.url + $($element).attr('href');
		      moduleLinks.push(link);
		    });
		    next();
		  } else if (err) {
		  	errors.push(err);
		  }
		});
  }, 20);

  q.push(links);

  q.drain = function() {
  	console.log("Scraping terminated");
  	console.log("Errors: " + errors.length);
  	if (errors.length > 0) {
  		for(var i in errors) {
  			console.log(i + ": " + errors[i].message);
  		}
  	}

  	promise(moduleLinks);
  };
};

app.getModuleData = function(moduleLinks) {
  var modules = [],
      failed  = [],
      errors  = [];

  var q = app.async.queue(function(url, next) {
    app.request(url, function(err, res, html) {
      if (!err && res.statusCode == 200) {
        var $ = app.cheerio.load(html);
        var module = {};

        $('.courseBodyPnl').find('tr').each(function(index, $element) {
          var $tds = $($element).find('td');
          var key  = $tds.first().text().trim().replace(":", "");
          var val  = $tds.last().text().trim().replace(":", "");

          module[key] = val;
        });

        if (module['Module title'].indexOf("System.NullReferenceException") != -1) {
          failed.push(module);
        } else {
          modules.push(module);
        }
        
        console.log("Modules: " + modules.length + ", Failed: " + failed.length + ", Left: " + q.length());
        next();
      } else if (err) {
        errors.push(err);
      }
    });
  }, 20);

  q.push(moduleLinks);

  q.drain = function() {
    console.log(modules.length + " modules");
    console.log(failed.length  + " failed");
    app.writeToFile(modules.sort(app.sortModules), failed.sort(app.sortModules));
  };
};

app.writeToFile = function(modules, failed) {
  app.fs.writeFile('data.json', JSON.stringify(modules, null, 2), function (err) {
    if (err) throw err;
    console.log('Modules saved!');
  });

  app.fs.writeFile('failed.json', JSON.stringify(failed, null, 2), function (err) {
    if (err) throw err;
    console.log('Failed saved!');
  });
};

app.sortModules = function(a, b) {
  var moduleTitleA = a['Module title'].toLowerCase();
  var moduleTitleB = b['Module title'].toLowerCase();

  if (moduleTitleA > moduleTitleB) {
    return 1;
  } else if (moduleTitleA < moduleTitleB) {
    return -1;
  } else {
    return 0;
  }
}

app.run = function() {
  app.getAlphabetLinks(function(links) {
		console.log(links.length, "alphabet links found");

		app.getModuleLinks(links, function(moduleLinks) {
	    console.log(moduleLinks.length, "module links found");

      app.getModuleData(moduleLinks);
		});
	});
};

// app.getModuleData([
//   "http://www.modules.napier.ac.uk/Module.aspx?ID=SET09109",
//   "http://www.modules.napier.ac.uk/Module.aspx?ID=SET09107",
//   "http://www.modules.napier.ac.uk/Module.aspx?ID=SOC10101"
// ]);

app.run();