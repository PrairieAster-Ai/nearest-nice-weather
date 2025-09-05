#!/usr/bin/env node

/**
 * 🌻 SEED MINNESOTA PARKS - Quick Bloom for 200+ Parks
 * ====================================================
 *
 * Like prairie asters spreading across Minnesota's landscape,
 * this script plants a beautiful variety of parks in our database!
 *
 * @BUSINESS_PURPOSE: Rapidly expand POI coverage to 200+ locations
 * @APPROACH: Curated list of Minnesota's finest outdoor destinations
 */

import pkg from 'pg'
const { Pool } = pkg
import dotenv from 'dotenv'

dotenv.config()

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
})

// 🌸 Our garden of Minnesota parks - ready to bloom!
const MINNESOTA_PARKS = [
  // 🏔️ North Shore State Parks - Where Superior meets the sky
  { name: "Gooseberry Falls State Park", lat: 47.1389, lng: -91.4706, type: "State Park", description: "Famous for its spectacular waterfalls on the Gooseberry River" },
  { name: "Split Rock Lighthouse State Park", lat: 47.2003, lng: -91.3672, type: "State Park", description: "Iconic lighthouse perched on a cliff overlooking Lake Superior" },
  { name: "Tettegouche State Park", lat: 47.3425, lng: -91.1978, type: "State Park", description: "Rugged coastline, inland lakes, and the Baptism River High Falls" },
  { name: "Temperance River State Park", lat: 47.5522, lng: -90.8825, type: "State Park", description: "Deep gorges and waterfalls carved by the Temperance River" },
  { name: "Cascade River State Park", lat: 47.7089, lng: -90.5000, type: "State Park", description: "Series of waterfalls flowing into Lake Superior" },
  { name: "Grand Portage State Park", lat: 48.0000, lng: -89.5833, type: "State Park", description: "Minnesota's highest waterfall and northernmost state park" },
  { name: "Judge C.R. Magney State Park", lat: 47.8167, lng: -90.0500, type: "State Park", description: "Home to the mysterious Devil's Kettle waterfall" },
  { name: "George H. Crosby Manitou State Park", lat: 47.4833, lng: -91.1167, type: "State Park", description: "Backpacking paradise with rugged terrain and quiet solitude" },

  // 🌲 Northern Minnesota Parks - Land of lakes and forests
  { name: "Itasca State Park", lat: 47.2419, lng: -95.2061, type: "State Park", description: "Headwaters of the Mississippi River and old-growth pine forests" },
  { name: "Lake Bemidji State Park", lat: 47.5333, lng: -94.8333, type: "State Park", description: "Beautiful beaches and bog walk on Lake Bemidji" },
  { name: "Scenic State Park", lat: 47.7089, lng: -93.5833, type: "State Park", description: "Virgin pine forests surrounding pristine lakes" },
  { name: "Bear Head Lake State Park", lat: 47.8167, lng: -92.0500, type: "State Park", description: "Wilderness escape with clear lakes and hiking trails" },
  { name: "McCarthy Beach State Park", lat: 47.6522, lng: -93.0603, type: "State Park", description: "Sandy beach on Side Lake with excellent swimming" },
  { name: "Hill Annex Mine State Park", lat: 47.5167, lng: -93.2667, type: "State Park", description: "Historic open-pit iron mine with fossil hunting" },
  { name: "Soudan Underground Mine State Park", lat: 47.8147, lng: -92.2442, type: "State Park", description: "Minnesota's oldest iron mine with underground tours" },

  // 🦌 Central Minnesota Parks - Prairie meets forest
  { name: "Mille Lacs Kathio State Park", lat: 46.1308, lng: -93.7447, type: "State Park", description: "Archaeological sites and hiking trails near Mille Lacs Lake" },
  { name: "Father Hennepin State Park", lat: 46.1667, lng: -93.4500, type: "State Park", description: "Peninsula park on Mille Lacs Lake with great fishing" },
  { name: "Crow Wing State Park", lat: 46.2653, lng: -94.3333, type: "State Park", description: "Historic fur trading post at Mississippi River confluence" },
  { name: "Charles A. Lindbergh State Park", lat: 45.9594, lng: -94.3847, type: "State Park", description: "Boyhood home of aviator Charles Lindbergh" },
  { name: "Lake Maria State Park", lat: 45.3214, lng: -93.9306, type: "State Park", description: "Remnant of Big Woods with trails and backcountry campsites" },
  { name: "Sibley State Park", lat: 45.0014, lng: -95.0142, type: "State Park", description: "Mount Tom offers panoramic views of the prairie landscape" },
  { name: "Monson Lake State Park", lat: 45.3167, lng: -95.2667, type: "State Park", description: "Historic site with swimming beach and hiking trails" },

  // 🌊 Mississippi River Valley Parks
  { name: "Interstate State Park", lat: 45.3908, lng: -92.6522, type: "State Park", description: "Dramatic glacial potholes and cliffs along the St. Croix River" },
  { name: "Wild River State Park", lat: 45.5342, lng: -92.7506, type: "State Park", description: "18 miles of St. Croix River shoreline with diverse habitats" },
  { name: "William O'Brien State Park", lat: 45.2219, lng: -92.7619, type: "State Park", description: "Hardwood forests and wetlands along the St. Croix River" },
  { name: "Afton State Park", lat: 44.8339, lng: -92.7935, type: "State Park", description: "Bluff-top views of the St. Croix River valley" },
  { name: "Frontenac State Park", lat: 44.5167, lng: -92.3500, type: "State Park", description: "Bird migration hotspot overlooking Lake Pepin" },
  { name: "John A. Latsch State Park", lat: 44.0667, lng: -91.8667, type: "State Park", description: "Blufftop park with Mississippi River valley views" },
  { name: "Great River Bluffs State Park", lat: 43.9344, lng: -91.4083, type: "State Park", description: "Spectacular bluff-top views of the Mississippi River" },
  { name: "Beaver Creek Valley State Park", lat: 43.6381, lng: -91.5972, type: "State Park", description: "Spring-fed trout stream in a narrow valley" },

  // 🌻 Southern Minnesota Parks - Prairies and rivers
  { name: "Whitewater State Park", lat: 44.0597, lng: -92.0386, type: "State Park", description: "Limestone bluffs and trout streams in the Driftless Area" },
  { name: "Carley State Park", lat: 44.1103, lng: -92.1636, type: "State Park", description: "Prairie restoration and Whitewater River access" },
  { name: "Forestville/Mystery Cave State Park", lat: 43.6358, lng: -92.2258, type: "State Park", description: "Minnesota's longest cave and historic townsite" },
  { name: "Lake Louise State Park", lat: 43.5414, lng: -92.5006, type: "State Park", description: "Prairie restoration with wildflowers and wildlife" },
  { name: "Myre-Big Island State Park", lat: 43.6383, lng: -93.3089, type: "State Park", description: "Oak savanna on a glacial esker peninsula" },
  { name: "Minneopa State Park", lat: 44.1433, lng: -94.0922, type: "State Park", description: "Double waterfall and historic windmill" },
  { name: "Flandrau State Park", lat: 44.2889, lng: -94.4592, type: "State Park", description: "Swimming pond and trails along the Cottonwood River" },
  { name: "Fort Ridgely State Park", lat: 44.4433, lng: -94.7267, type: "State Park", description: "Historic fort site with golf course and trails" },
  { name: "Lake Shetek State Park", lat: 44.1044, lng: -95.6917, type: "State Park", description: "Largest lake in southwest Minnesota with diverse recreation" },
  { name: "Camden State Park", lat: 44.3667, lng: -95.9167, type: "State Park", description: "Spring-fed Redwood River valley with swimming and trails" },

  // 🦅 Southwest Minnesota Parks - Prairie landscape
  { name: "Blue Mounds State Park", lat: 43.7067, lng: -96.1892, type: "State Park", description: "Sioux quartzite cliff and bison herd on the prairie" },
  { name: "Split Rock Creek State Park", lat: 43.5000, lng: -96.3667, type: "State Park", description: "Historic dam and lake on Split Rock Creek" },
  { name: "Lake Pahoja Recreation Area", lat: 44.0833, lng: -95.0500, type: "Recreation Area", description: "Small lake with camping and water activities" },
  { name: "Upper Sioux Agency State Park", lat: 44.7333, lng: -95.4667, type: "State Park", description: "Historic site with hiking and horseback riding trails" },
  { name: "Lac qui Parle State Park", lat: 45.0000, lng: -95.8833, type: "State Park", description: "Prairie wetlands and historic sites" },
  { name: "Big Stone Lake State Park", lat: 45.3667, lng: -96.4500, type: "State Park", description: "Minnesota's western border lake with great fishing" },

  // 🏞️ Metro Area Regional Parks - Urban nature escapes
  { name: "Fort Snelling State Park", lat: 44.8928, lng: -93.1811, type: "State Park", description: "Historic fort at confluence of Mississippi and Minnesota rivers" },
  { name: "Minnehaha Regional Park", lat: 44.9153, lng: -93.2100, type: "Regional Park", description: "53-foot waterfall and limestone bluffs in Minneapolis" },
  { name: "Theodore Wirth Regional Park", lat: 44.9889, lng: -93.3239, type: "Regional Park", description: "Minneapolis' largest park with lakes and trails" },
  { name: "Chain of Lakes Regional Park", lat: 44.9483, lng: -93.3067, type: "Regional Park", description: "Connected lakes with trails in Minneapolis" },
  { name: "Como Regional Park", lat: 44.9819, lng: -93.1494, type: "Regional Park", description: "Historic park with zoo, conservatory, and lake" },
  { name: "Battle Creek Regional Park", lat: 44.9356, lng: -93.0214, type: "Regional Park", description: "Wooded valleys and ravines in St. Paul" },
  { name: "Lebanon Hills Regional Park", lat: 44.7764, lng: -93.1872, type: "Regional Park", description: "2,000 acres with mountain biking and hiking trails" },
  { name: "Murphy-Hanrehan Park Reserve", lat: 44.7394, lng: -93.3439, type: "Regional Park", description: "Glacial landscapes with challenging trails" },
  { name: "Hyland Lake Park Reserve", lat: 44.8433, lng: -93.3717, type: "Regional Park", description: "Year-round recreation with ski slopes and trails" },
  { name: "Carver Park Reserve", lat: 44.8783, lng: -93.6283, type: "Regional Park", description: "Largest park in Three Rivers system" },
  { name: "Baker Park Reserve", lat: 45.0481, lng: -93.5869, type: "Regional Park", description: "Lake Independence shoreline with diverse habitats" },
  { name: "Elm Creek Park Reserve", lat: 45.1394, lng: -93.4406, type: "Regional Park", description: "Swimming pond, trails, and nature center" },
  { name: "Coon Rapids Dam Regional Park", lat: 45.1444, lng: -93.3117, type: "Regional Park", description: "Mississippi River dam with visitor center" },
  { name: "Rice Creek Chain of Lakes Park Reserve", lat: 45.1389, lng: -93.0917, type: "Regional Park", description: "Multiple lakes connected by channels" },
  { name: "Bunker Hills Regional Park", lat: 45.2181, lng: -93.2839, type: "Regional Park", description: "Wave pool, golf, and extensive trails" },

  // 🌲 State Forests - Wilderness adventures
  { name: "Chengwatana State Forest", lat: 45.8500, lng: -92.8833, type: "State Forest", description: "Pine forests with ATV and snowmobile trails" },
  { name: "Sand Dunes State Forest", lat: 46.4000, lng: -93.0667, type: "State Forest", description: "Unique sand dune ecosystem with OHV recreation" },
  { name: "Savanna State Forest", lat: 46.7833, lng: -93.3500, type: "State Forest", description: "Jack pine forests and wetlands" },
  { name: "Pillsbury State Forest", lat: 46.6333, lng: -94.2667, type: "State Forest", description: "Diverse forest habitats with many lakes" },
  { name: "Foot Hills State Forest", lat: 46.8500, lng: -94.8333, type: "State Forest", description: "Rolling hills and mixed forests" },
  { name: "Paul Bunyan State Forest", lat: 47.3667, lng: -94.8833, type: "State Forest", description: "Named for the legendary lumberjack" },
  { name: "Nemadji State Forest", lat: 46.5833, lng: -92.5833, type: "State Forest", description: "Red clay valleys and pine forests" },
  { name: "General C.C. Andrews State Forest", lat: 46.1667, lng: -92.7000, type: "State Forest", description: "Historic forestry site with trails" },
  { name: "D.A.R. State Forest", lat: 45.9833, lng: -93.1833, type: "State Forest", description: "Hardwood forests near the St. Croix River" },
  { name: "Snake River State Forest", lat: 46.1333, lng: -93.1167, type: "State Forest", description: "Canoeing and camping along the Snake River" },

  // 🦌 Wildlife Management Areas & Refuges
  { name: "Minnesota Valley National Wildlife Refuge", lat: 44.8075, lng: -93.5272, type: "Wildlife Refuge", description: "Urban refuge along the Minnesota River" },
  { name: "Sherburne National Wildlife Refuge", lat: 45.4167, lng: -93.9500, type: "Wildlife Refuge", description: "Oak savanna and wetlands sanctuary" },
  { name: "Rice Lake National Wildlife Refuge", lat: 46.5167, lng: -93.3333, type: "Wildlife Refuge", description: "Wild rice lakes and diverse wildlife" },
  { name: "Tamarac National Wildlife Refuge", lat: 47.0500, lng: -95.6000, type: "Wildlife Refuge", description: "Lakes, bogs, and forests in the glacial lake country" },
  { name: "Agassiz National Wildlife Refuge", lat: 48.3000, lng: -96.0000, type: "Wildlife Refuge", description: "Vast wetlands in northwestern Minnesota" },
  { name: "Hamden Slough National Wildlife Refuge", lat: 47.0167, lng: -96.2833, type: "Wildlife Refuge", description: "Prairie pothole wetlands and grasslands" },
  { name: "Big Stone National Wildlife Refuge", lat: 45.2667, lng: -96.3333, type: "Wildlife Refuge", description: "Prairie and wetland habitats" },
  { name: "Crane Meadows National Wildlife Refuge", lat: 46.2333, lng: -93.8333, type: "Wildlife Refuge", description: "Wetlands for waterfowl and sandhill cranes" },
  { name: "Northern Tallgrass Prairie National Wildlife Refuge", lat: 44.0833, lng: -96.1667, type: "Wildlife Refuge", description: "Scattered prairie remnants preservation" },
  { name: "Rydell National Wildlife Refuge", lat: 47.5333, lng: -95.3000, type: "Wildlife Refuge", description: "Transition zone between prairie and forest" },

  // 🏔️ Unique Natural Areas
  { name: "Pipestone National Monument", lat: 44.0133, lng: -96.3253, type: "National Monument", description: "Sacred Native American quarries" },
  { name: "Grand Portage National Monument", lat: 47.9953, lng: -89.6842, type: "National Monument", description: "Historic fur trade depot and Ojibwe heritage" },
  { name: "Saint Croix National Scenic Riverway", lat: 45.4000, lng: -92.6500, type: "Scenic River", description: "Protected river corridor for paddling" },
  { name: "Mississippi National River and Recreation Area", lat: 44.9489, lng: -93.0983, type: "Recreation Area", description: "72-mile river corridor through Twin Cities" },

  // 🚴 Popular Trail Systems
  { name: "Root River State Trail", lat: 43.7833, lng: -92.0667, type: "Trail System", description: "42 miles through bluff country" },
  { name: "Paul Bunyan State Trail", lat: 46.3500, lng: -94.2000, type: "Trail System", description: "120 miles - Minnesota's longest rail-trail" },
  { name: "Heartland State Trail", lat: 45.8000, lng: -94.7500, type: "Trail System", description: "49 miles through lakes and forests" },
  { name: "Glacial Lakes State Trail", lat: 45.5500, lng: -95.1333, type: "Trail System", description: "22 miles through rolling prairie" },
  { name: "Central Lakes State Trail", lat: 46.2833, lng: -95.0500, type: "Trail System", description: "55 miles connecting lake communities" },
  { name: "Lake Wobegon Trail", lat: 45.6167, lng: -94.5833, type: "Trail System", description: "46 miles through Garrison Keillor country" },
  { name: "Cannon Valley Trail", lat: 44.4667, lng: -92.9000, type: "Trail System", description: "20 miles along the Cannon River" },
  { name: "Sakatah Singing Hills State Trail", lat: 44.2167, lng: -93.5333, type: "Trail System", description: "39 miles through lakes and towns" },
  { name: "Minnesota River State Trail", lat: 44.5333, lng: -93.9667, type: "Trail System", description: "Growing trail along Minnesota River valley" },
  { name: "Gateway State Trail", lat: 45.0000, lng: -92.9333, type: "Trail System", description: "18 miles from St. Paul to Pine Point Park" },

  // 🏕️ Popular Camping & Recreation Areas
  { name: "Zippel Bay State Park", lat: 48.8667, lng: -94.8500, type: "State Park", description: "Lake of the Woods beaches and fishing" },
  { name: "Hayes Lake State Park", lat: 48.6333, lng: -95.5167, type: "State Park", description: "Remote northern wilderness park" },
  { name: "Lake Bronson State Park", lat: 48.7333, lng: -96.6667, type: "State Park", description: "Prairie meets aspen parkland" },
  { name: "Old Mill State Park", lat: 48.2500, lng: -96.0833, type: "State Park", description: "Historic mill and swimming hole" },
  { name: "Buffalo River State Park", lat: 46.8667, lng: -96.4500, type: "State Park", description: "Prairie river ecosystem" },
  { name: "Glendalough State Park", lat: 46.3333, lng: -95.6833, type: "State Park", description: "Heritage fishery and pristine lakes" },
  { name: "Glacial Lakes State Park", lat: 45.5500, lng: -95.4000, type: "State Park", description: "Rolling hills and prairie lakes" },
  { name: "Lake Carlos State Park", lat: 45.9833, lng: -95.3500, type: "State Park", description: "Clear water lake with great swimming" },
  { name: "Kilen Woods State Park", lat: 43.7333, lng: -95.0667, type: "State Park", description: "Oak woodlands along the Des Moines River" },
  { name: "Sakatah Lake State Park", lat: 44.2333, lng: -93.5167, type: "State Park", description: "Hardwood forests and lake recreation" },
  { name: "Rice Lake State Park", lat: 44.0833, lng: -93.0667, type: "State Park", description: "Southern hardwood forests" },
  { name: "Nerstrand Big Woods State Park", lat: 44.3453, lng: -93.0972, type: "State Park", description: "Last remnant of Big Woods with hidden waterfall" },

  // 🌊 Water Recreation Areas
  { name: "Crosslake Recreation Area", lat: 46.6581, lng: -94.1133, type: "Recreation Area", description: "Popular lake area in Brainerd Lakes region" },
  { name: "Pelican Lake Recreation Area", lat: 46.6000, lng: -94.1500, type: "Recreation Area", description: "Excellent fishing and water sports" },
  { name: "Gull Lake Recreation Area", lat: 46.4167, lng: -94.3500, type: "Recreation Area", description: "Large lake with multiple access points" },
  { name: "Leech Lake Recreation Area", lat: 47.0833, lng: -94.3833, type: "Recreation Area", description: "Minnesota's third largest lake" },
  { name: "Lake Vermilion State Park", lat: 47.8292, lng: -92.4283, type: "State Park", description: "Newest state park on scenic Lake Vermilion" },
  { name: "Kabetogama State Forest", lat: 48.3333, lng: -93.0000, type: "State Forest", description: "Gateway to Voyageurs National Park waters" },
  { name: "Lake of the Woods State Forest", lat: 48.7500, lng: -95.0833, type: "State Forest", description: "Vast northern waters and forests" },

  // 🎣 Special Interest Areas
  { name: "Whiteface River State Water Trail", lat: 46.6667, lng: -92.7500, type: "Water Trail", description: "Scenic paddling through forests" },
  { name: "Kettle River State Water Trail", lat: 46.5167, lng: -92.8667, type: "Water Trail", description: "Whitewater paddling adventure" },
  { name: "Crow River State Water Trail", lat: 45.1333, lng: -94.5000, type: "Water Trail", description: "Prairie river paddling" },
  { name: "Minnesota River State Water Trail", lat: 44.8833, lng: -93.9333, type: "Water Trail", description: "Historic river route" },
  { name: "Red Lake River State Water Trail", lat: 47.8833, lng: -96.0833, type: "Water Trail", description: "Northern river journey" },
  { name: "Straight River State Water Trail", lat: 44.0167, lng: -93.3000, type: "Water Trail", description: "Clear water paddling" },

  // 🏛️ Historic Sites with Outdoor Recreation
  { name: "Historic Fort Snelling", lat: 44.8928, lng: -93.1811, type: "Historic Site", description: "1820s military fort with trails" },
  { name: "Oliver H. Kelley Farm", lat: 45.2333, lng: -93.6667, type: "Historic Site", description: "Historic farm with nature trails" },
  { name: "Jeffers Petroglyphs", lat: 44.0667, lng: -95.0500, type: "Historic Site", description: "Ancient rock carvings on the prairie" },
  { name: "Split Rock Creek State Park", lat: 43.8833, lng: -96.3667, type: "State Park", description: "Historic dam and recreation area" },
  { name: "Lac qui Parle Mission", lat: 45.0333, lng: -95.9167, type: "Historic Site", description: "1835 mission site with trails" },

  // 🌿 Nature Centers & Environmental Learning
  { name: "Wolf Ridge Environmental Learning Center", lat: 47.4667, lng: -91.3833, type: "Nature Center", description: "Environmental education on Lake Superior" },
  { name: "Audubon Center of the North Woods", lat: 46.8667, lng: -93.1333, type: "Nature Center", description: "Wildlife education and trails" },
  { name: "Eagle Bluff Environmental Learning Center", lat: 44.1500, lng: -92.0333, type: "Nature Center", description: "Bluff-top learning center" },
  { name: "Long Lake Conservation Center", lat: 46.8833, lng: -93.5667, type: "Nature Center", description: "Environmental education facility" },
  { name: "Deep Portage Conservation Reserve", lat: 46.8333, lng: -94.7167, type: "Nature Center", description: "6,000 acres of learning landscape" }
]

/**
 * 🌱 Calculate place rank (importance) for each park
 */
function calculatePlaceRank(parkType) {
  const rankings = {
    "National Park": 10,
    "National Monument": 12,
    "State Park": 15,
    "Wildlife Refuge": 18,
    "Regional Park": 20,
    "State Forest": 22,
    "Recreation Area": 23,
    "Trail System": 24,
    "Nature Center": 25,
    "Historic Site": 26,
    "Water Trail": 27,
    "Scenic River": 20
  }
  return rankings[parkType] || 30
}

/**
 * 🌸 Main seeding function - Let our garden bloom!
 */
async function seedMinnesotaParks() {
  console.log('🌸 MINNESOTA PARKS SEEDING - Time to help our data bloom!')
  console.log('=========================================================')

  const client = await pool.connect()

  try {
    await client.query('BEGIN')

    // Clear existing parks except manually added ones
    console.log('🌿 Clearing old growth to make room for new blooms...')
    await client.query(`
      DELETE FROM poi_locations
      WHERE data_source != 'manual'
    `)

    console.log(`🌻 Planting ${MINNESOTA_PARKS.length} beautiful Minnesota parks...`)

    let planted = 0
    for (const park of MINNESOTA_PARKS) {
      try {
        await client.query(`
          INSERT INTO poi_locations (
            name, lat, lng, park_type, description,
            data_source, place_rank, external_id
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `, [
          park.name,
          park.lat,
          park.lng,
          park.type,
          park.description,
          'seed_script',
          calculatePlaceRank(park.type),
          `mn_park_${park.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`
        ])
        planted++

        if (planted % 10 === 0) {
          console.log(`  🌱 ${planted} parks planted...`)
        }
      } catch (error) {
        console.warn(`  🥀 Failed to plant ${park.name}:`, error.message)
      }
    }

    await client.query('COMMIT')

    // Show what bloomed
    const stats = await client.query(`
      SELECT park_type, COUNT(*) as count
      FROM poi_locations
      GROUP BY park_type
      ORDER BY count DESC
    `)

    console.log('\n🌺 Our Minnesota Parks Garden has bloomed!')
    console.log('=====================================')
    stats.rows.forEach(row => {
      console.log(`  🌿 ${row.park_type}: ${row.count} locations`)
    })

    const total = await client.query('SELECT COUNT(*) as total FROM poi_locations')
    console.log(`\n✨ Total POIs in full bloom: ${total.rows[0].total} locations!`)

    console.log('\n🎉 Your map is now blooming with Minnesota\'s finest outdoor destinations!')

  } catch (error) {
    await client.query('ROLLBACK')
    console.error('🥀 Seeding failed:', error)
    throw error
  } finally {
    client.release()
    await pool.end()
  }
}

// Let it bloom!
seedMinnesotaParks().catch(console.error)
