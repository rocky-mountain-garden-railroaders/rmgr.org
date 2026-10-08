export type ResourceItem = {
  title: string
  description: string
  href: string
}

export type ResourceSection = {
  title: string
  items: ResourceItem[]
}

export const resourcesSections: ResourceSection[] = [
  {
    title: 'Attractions/Events',
    items: [
      {
        title: 'Zoo Lights',
        description: 'An annual holiday light festival hosted by the Calgary Zoo in Calgary, Alberta. The RMGR is builds a layout in the conservatory.',
        href: 'https://www.calgaryzoo.com/zoo-lights',
      },
      {
        title: 'Supertrain Calgary',
        description: 'The largest model train show in Canada, located in Calgary.',
        href: 'https://supertrain.ca',
      },
      {
        title: 'Iron Horse Park',
        description: 'Calgary-area miniature railway and family destination.',
        href: 'https://ironhorsepark.ca/',
      },
      {
        title: 'Aspen Crossing',
        description: 'Railway-themed campground destination with a real railway.',
        href: 'https://www.aspencrossing.com/',
      },
    ],
  },
  {
    title: 'Social Media Pages',
    items: [
      {
        title: 'Riks Railway',
        description:
          'A blog for a British model railway, Rik has been featured in numerous G-Scale magazines.',
        href: 'https://riksrailway.blogspot.com/',
      },
      {
        title: 'Garden Railroads SubReddit',
        description: 'Community discussions and shared layout photos.',
        href: 'https://www.reddit.com/r/GardenRailroads/top/?screen_view_count=2&ext-referrer=DIRECT&t=month',
      },
      {
        title: 'Brunel Models Instagram',
        description: 'Layouts, products, and model railroading inspiration.',
        href: 'https://www.instagram.com/brunelmodels/',
      },
      {
        title: 'Garden Railroaders Facebook Group',
        description: 'Club-style discussion and shared posts from garden railway fans.',
        href: 'https://www.facebook.com/groups/814561258654535/',
      },
    ],
  },
  {
    title: 'Stores/Shopping',
    items: [
      {
        title: 'Trains and Such',
        description: 'Local hobby shop specializing in model railroading in all scales.',
        href: 'https://trainsandsuch.com/',
      },
      {
        title: 'Ultimate Trains',
        description: 'Online store for G-Scale trains and accessories. Located in Nanton, Alberta. It\'s best to call or email.',
        href: 'https://www.ultimatetrains.com/',
      },
      {
        title: 'LGB',
        description: 'Gold standard in quality for G-Scale products.',
        href: 'https://www.lgb.com/',
      },
    ],
  },
  {
    title: 'Model Making Tips',
    items: [
      {
        title: 'Garden Railways Magazine',
        description: 'Articles and inspiration focused on garden railroading.',
        href: 'https://www.trains.com/grw/',
      },
      {
        title: 'Model Railroader Magazine',
        description: 'Articles, how-tos, and layout inspiration.',
        href: 'https://www.trains.com/mrr/',
      },
    ],
  },
  {
    title: 'Painting Tips And Tutorials',
    items: [
      {
        title: 'Märklin of Sweden',
        description: 'A railway Youtube channel focusing on painting and modelling.',
        href: 'https://www.youtube.com/@marklinofsweden',
      },
    ],
  },
  {
    title: 'YouTube Channels',
    items: [
      {
        title: 'HSBA Garden Railway',
        description: 'Another British garden railway channel with a great layoutf.',
        href: 'https://www.youtube.com/@hsbagardenrailway',
      },
      {
        title: 'Summit Railway',
        description: 'A German model railroader with regular content and updates.',
        href: 'https://www.youtube.com/@summitrailway',
      },
      {
        title: 'Hornhausen',
        description: 'A German vlogger who documents European G-Scale layouts.',
        href: 'https://www.youtube.com/@Hornhausen',
      },
    ],
  },
  {
    title: 'Model Railroad Clubs In Alberta',
    items: [
      {
        title: 'Calgary Model Railway Society (CMRS)',
        description: 'Information on upcoming events, model railway clubs in the Calgary area.',
        href: 'https://www.calgarymodelrailway.ca/',
      },
      {
        title: 'Northern Alberta Garden Railroaders',
        description: 'Garden Railway club located in Edmonton, AB',
        href: 'https://www.facebook.com/NorthernAlbertaGardenRailroaders/',
      },
      {
        title: 'Calgary British Railway Modellers',
        description: 'Multi-scale club in Calgary, Alberta focusing on British models.',
        href: 'https://calgarybritishrailwaymodellers.ca/',
      },
    ],
  },
  {
    title: 'Other Nearby Model Railroad Clubs',
    items: [
      {
        title: 'Greater Vancouver Garden Railway Club',
        description: 'Club of over 100 members in the Vancouver area.',
        href: 'https://gvgrc.ca/',
      },
      {
        title: 'Vancouver Island Garden Railway Club',
        description: 'Club spanning all of Vancouver Island.',
        href: 'https://vigardenrailwayclub.com/',
      },
      {
        title: 'Saskatoon Railway Modellers',
        description: 'Club in Saskatoon, Saskatchewan.',
        href: 'https://srmtrains.ca/',
      },
    ],
  },
  {
    title: 'Other Resources',
    items: [
      {
        title: 'National Model Railroad Association',
        description: 'Standards, learning materials, and hobby resources.',
        href: 'https://www.nmra.org',
      },
    ],
  },
]
