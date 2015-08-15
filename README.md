# Node (Cheerio) Web Scraper
### Edinburgh Napier University - Module Catalogue

Used to scrape module data from Napier's module catalogue and store it in the `data.json` file. Looks for exceptions coming from the .NET backend and stores these as 'failed' module downloads in the `failed.json` file.

Functions:

`app.getAlphabetLinks(promise)` - Scrapes the alphabet bar at the top of the module catalogue and constructs URLs for scraping modules under each letter from the `href` attribute of each letter's element. Alphabet links are then stored in a JavaScript array before being passed to `getModuleLinks(alphabetLinks, promise)` when the promise callback is invoked.

`app.getModuleLinks(alphabetLinks, promise)` - Iterates over the alphabet links array to scrape each module's URL. Module links are similarly stored in a JavaScript array and passed to the next scraping stage, `getModuleData(moduleLinks)` asynchronously via the promise callback.

`app.getModuleData(moduleLinks)`

`app.writeToFile()`

`app.run()`
