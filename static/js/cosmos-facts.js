// Facts are kept separate from the drawing code so the atlas can reuse them.
// Planet facts follow the same order as PLANETS in cosmos-scenes.js.
export const PLANET_FACTS = [
  [
    'A year lasts just 88 Earth days because this little world races around the Sun. It completes more than 4 orbits while Earth finishes 1.',
    'One sunrise to the next takes about 176 Earth days. The planet spins slowly while moving quickly along its orbit, so its solar day is unusually long.',
    'Daytime temperatures near the equator can reach 430°C, then plunge to about -180°C at night. There is almost no atmosphere to hold the heat.',
    'Some craters near the poles never see sunlight. Water ice can survive in those permanently shadowed places, even on a world so close to the Sun.',
    'Long cliffs called scarps stretch for hundreds of kilometers. They formed as the interior cooled, the planet shrank, and its crust crumpled.',
  ],
  [
    'The surface sits near 465°C, hotter than Mercury. A thick carbon dioxide atmosphere traps heat in an extreme version of the greenhouse effect.',
    'It turns opposite to most planets, so the Sun would rise in the west. One rotation takes about 243 Earth days.',
    'A year lasts about 225 Earth days, but one spin takes about 243. The calendar would turn over before the planet finished rotating once.',
    'Surface air pressure is about 92 times what we feel at sea level. That is roughly like being 900 meters underwater on Earth.',
    'The bright clouds contain droplets of sulfuric acid. They hide a rocky surface with volcanoes and broad plains of old lava.',
  ],
  [
    'Sunlight crosses about 150 million kilometers to reach us. Even at light speed, the trip takes roughly 8 minutes and 20 seconds.',
    'Liquid water covers about 71% of the surface. All that water stores heat and helps soften changes in temperature.',
    'Our magnetic field helps deflect charged particles from the Sun. When some reach the upper atmosphere, they can light up the sky as auroras.',
    'The Moon is about 384,000 kilometers away on average. Its gravity drives much of the ocean’s tides and helps steady our planet’s tilt.',
    'This is the only world where we have confirmed life so far. Some of the oldest evidence points to organisms living here at least 3.5 billion years ago.',
  ],
  [
    'Olympus Mons rises more than 20 kilometers above the surrounding plains. It is the largest known volcano in the Solar System.',
    'A day lasts about 24 hours and 39 minutes, only a little longer than ours. That familiar rhythm is one reason scientists use the word “sol” for a day here.',
    'Valles Marineris stretches roughly 4,000 kilometers across the surface. Parts of this canyon system are about 7 kilometers deep.',
    'The air is mostly carbon dioxide and its surface pressure is less than 1% of ours. Dust storms can sometimes spread around the whole planet.',
    'The polar caps hold water ice year-round. In winter, frozen carbon dioxide builds up on top, then turns back into gas as spring arrives.',
  ],
  [
    'This giant is about 11 times wider than Earth. By volume, you could fit more than 1,300 Earths inside it.',
    'The Great Red Spot is a storm observed for more than 150 years. It is still wider than Earth, although it has been shrinking.',
    'One rotation takes about 10 hours, the shortest day of any planet. That fast spin helps stretch its clouds into colorful bands.',
    'Its 4 largest moons are Io, Europa, Ganymede, and Callisto. Galileo spotted them in 1610 with an early telescope.',
    'Ganymede is about 5,268 kilometers across, making it the largest moon in the Solar System. It is even wider than Mercury.',
  ],
  [
    'The main rings stretch about 280,000 kilometers across, yet many parts are only tens of meters thick. Most of the material is ice.',
    'Titan has lakes and seas of liquid methane and ethane. At about 5,150 kilometers across, this moon is larger than Mercury.',
    'Enceladus sprays water vapor through cracks in its icy shell. Those plumes offer a glimpse of the ocean hidden below.',
    'Its average density is about 0.69 grams per cubic centimeter, lower than water. That is surprising for such a large planet.',
    'A trip around the Sun takes about 29 Earth years, while one spin takes only about 11 hours. The seasons are long, but the days are short.',
  ],
  [
    'Its axis is tilted about 98 degrees, so it seems to roll around the Sun on its side. That gives it seasons unlike any other planet’s.',
    'One trip around the Sun takes 84 Earth years. Near a pole, daylight can last around 42 years before a similarly long darkness follows.',
    'Methane in the atmosphere absorbs red light and helps give the planet its blue-green color. Beneath the clouds, it is cold and windy.',
    'William Herschel found it in 1781. It was the first planet discovered with a telescope, expanding the known Solar System overnight.',
    'Its faint rings were discovered in 1977 when they briefly blocked a star’s light. Astronomers now know of 13 narrow rings.',
  ],
  [
    'Winds in its atmosphere can race past 2,000 kilometers per hour. They are among the fastest measured anywhere in the Solar System.',
    'One trip around the Sun takes about 165 Earth years. In 2011, it completed its first full orbit since astronomers discovered it.',
    'Astronomers worked out where to look from tiny changes in Uranus’s orbit. They found the distant planet in 1846, close to the predicted spot.',
    'It sits about 4.5 billion kilometers from the Sun on average. Sunlight needs more than 4 hours to get there.',
    'Triton, its largest moon, travels backward around the planet. That unusual orbit suggests it was captured rather than formed there.',
  ],
];

export const SOLAR_FEATURES = {
  system: {
    name: 'Solar System',
    facts: [
      'Our cosmic neighborhood formed about 4.6 billion years ago when a cloud of gas and dust collapsed. The Sun grew at the center while leftover material became planets and smaller worlds.',
      'Eight planets orbit the Sun, along with hundreds of moons and countless smaller objects. Scientists also recognize 5 dwarf planets, including Ceres and Pluto.',
      'The planets travel around the Sun in nearly the same flat plane. That pattern is a clue that they formed inside one broad, spinning disk.',
      'Sunlight reaches Earth in about 8 minutes and 20 seconds. By the time it reaches Neptune, it has been traveling for more than 4 hours.',
      'The distant Oort Cloud may extend as far as 100,000 times Earth’s distance from the Sun. Our little diagram compresses an enormous amount of space.',
    ],
  },
  sun: {
    name: 'Sun',
    facts: [
      'This star holds about 99.8% of the mass in our planetary system. Its gravity keeps the planets moving in their orbits.',
      'The core reaches roughly 15 million degrees Celsius. There, hydrogen fuses into helium and releases the energy that eventually reaches us as light and heat.',
      'Its light travels about 150 million kilometers to Earth in roughly 8 minutes and 20 seconds. We always see it a little as it was in the past.',
      'Magnetic activity rises and falls in a cycle of roughly 11 years. Near the peak, sunspots and solar storms tend to become more common.',
      'The solar wind carries charged particles through space at hundreds of kilometers per second. It helps shape comet tails and can trigger auroras here at home.',
    ],
  },
  asteroid: {
    name: 'Asteroid Belt',
    facts: [
      'Most of these rocky objects circle between Mars and Jupiter, roughly 300 to 500 million kilometers from the Sun. They are leftovers from the early Solar System.',
      'Movies often show rocks packed together, but there is plenty of empty space here. Spacecraft have crossed the region many times without dodging a maze of boulders.',
      'Ceres is the largest object in this region at about 940 kilometers across. It is large enough to be classified as a dwarf planet.',
      'Add up every object here and you still get only about 3% of the Moon’s mass. The belt looks busy in a diagram, but it is remarkably sparse.',
      'Jupiter’s repeated gravitational tugs clear gaps at certain distances. These are called Kirkwood gaps, and they help reveal how orbital rhythms shape the belt.',
    ],
  },
  kuiper: {
    name: 'Kuiper Belt',
    facts: [
      'This broad region of icy objects begins beyond Neptune, about 30 times farther from the Sun than Earth is. Much of it extends out to roughly 50 times our distance.',
      'Pluto is one of the best-known worlds in this distant collection. It takes about 248 Earth years to complete one trip around the Sun.',
      'Some short-period comets began in this outer neighborhood. A close encounter with a giant planet can send an icy object toward the inner Solar System.',
      'Water, methane, and other ices have remained cold for billions of years out here. They preserve clues about the material from which planets formed.',
      'New Horizons flew past Pluto in 2015 and Arrokoth in 2019. Those visits gave us close views of 2 very different worlds in this distant region.',
    ],
  },
};

export function pickFactIndex(count, previous = -1, random = Math.random) {
  if (count <= 1) return 0;
  if (previous < 0 || previous >= count) return Math.floor(random() * count);
  return (previous + 1 + Math.floor(random() * (count - 1))) % count;
}
