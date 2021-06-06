const dfd = require("danfojs-node");
const axios = require('axios');

const cheerio = require('cheerio');

async function crawl_award() {
    try {
        const {data} = await axios.get('https://www.nba.com/history/awards/defensive-team');
        const $ = cheerio.load(data);

        // console.log($('.Article_article__2Ue3h').text())
        let text = $('.Article_article__2Ue3h').text();

        text = text.split(/(^\d\d\d\d-\d\d\n)+/gm);

        // Array to store the aggregated data
        let award_data = [];

        // We iterate over the text
        for (const [index, element] of text.entries()) {
            // the array structure is the following
            // ['> NBA History: Award...','2019-20\n', 'First Team\n +...']
            // The 0 elemnt of the array contains the header
            // the 1 element of the array contains the year
            // the 2 element of the array contains the data
            // ['header', 'year', 'data','year', 'data','year', 'data',...]
            // We only want to process when on 'year' element
            if(! (index % 2)) continue;

            // Get next year, we will use the final year of the season
            const Year = parseInt(element.split('-')[0])+1;

            // We get the awarded data from the next element in the array
            const awarded = text[index+1].split('\n');

            // We calculate where the second team selection starts
            const second_team_index = awarded.indexOf('Second Team');

            const first_team = awarded.slice(1, second_team_index)
            const second_team = awarded.slice(second_team_index+1)

            // we parse the first team and add it to our array
            award_data = award_data.concat(parsDefensiveTeam(first_team,Year,1));

            // we parse the second team and add it to our array
            award_data = award_data.concat(parsDefensiveTeam(second_team,Year,2));
        }

        console.log(award_data);

        const award_df = new dfd.DataFrame(award_data);

        // Replace the apostrophe in all the players names
        award_df['Player'] = award_df['Player'].str.replace('’','\'');

        // Replace "Ron Artest" with "Metta World"
        award_df['Player'] = award_df['Player'].str.replace('Ron Artest','Metta World');

        // Fix typo on Patrick Beverley name
        award_df['Player'] = award_df['Player'].str.replace('Patrick Beverly','Patrick Beverley');

        award_df
            // .loc({columns: ["Year", "Player","defensive_team"]})
            // .query({ column: "Year", is: "==", to: 2000})
            .query({ column: "Player", is: "==", to: 'Shaquille O\'Neal'})
            .head().print();
    
        award_df.to_csv('nba_defensive_teams.csv');
            // fixing name typo in from awards page we crawled
            
    } catch (error) {
        console.log(error);
        console.log('Error exit')
    }
}

function parsDefensiveTeam(data, Year, df_number) {
    const award_data = []
    for( const player of data){
		// we extract the team
    	const Tm =  (player.split(',')[1] || "").trim();
        
        // Extract the player name
    	const Player = player.split(',')[0].trim();
    	if(!player) continue;

    	award_data.push({
    		Year: parseInt(Year),
    		Player,
    		Tm,
    		defensive_team: df_number,
    	})
    }
    return award_data;
}
crawl_award()
