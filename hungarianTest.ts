import { HungarianAlgorithm } from "@/lib/HungarianAlgorithm";

const staffList: Map<string, Map<string, number>> = new Map();

staffList.set("Alice", new Map([
	["Ride1:Position1", 33],
	["Ride1:Position2", 18],
	["Ride4:Position2", 29],
]));

staffList.set("Bob", new Map([
	["Ride1:Position1", 21],
	["Ride1:Position2", 31],
	["Ride2:Position1", 27],
]));

staffList.set("Charlie", new Map([
	["Ride3:Position1", 50],
]));

staffList.set("Diana", new Map([
	["Ride1:Position2", 28],
	["Ride5:Position1", 48],
]));

staffList.set("Ethan", new Map([
	["Ride1:Position1", 30],
	["Ride2:Position2", 24],
	["Ride5:Position2", 39],
]));

staffList.set("Fiona", new Map([
	["Ride1:Position1", 22],
	["Ride2:Position1", 40],
	["Ride4:Position2", 37],
	["Ride5:Position1", 29],
]));

staffList.set("George", new Map([
	["Ride1:Position2", 32],
	["Ride2:Position2", 26],
	["Ride3:Position2", 43],
	["Ride4:Position1", 35],
]));

staffList.set("Hannah", new Map([
	["Ride1:Position1", 27],
	["Ride5:Position1", 25],
]));

staffList.set("Isaac", new Map([
	["Ride1:Position2", 35],
	["Ride2:Position1", 31],
	["Ride3:Position1", 47],
	["Ride5:Position2", 41],
]));

staffList.set("Julia", new Map([
	["Ride1:Position1", 36],
	["Ride3:Position2", 38],
	["Ride4:Position1", 42],
	["Ride5:Position1", 34],
]));

const hungarian = new HungarianAlgorithm(staffList);
console.log(hungarian.solve());