export const CARDS = 8;
export const DIM = 6;
const MAX = (1 << DIM);

const MIN_QUADS_INIT = 2;
const MAX_QUADS_INIT = 5;


/**
* Returns a layout of cards with a bunch of quads in it, taken by hashing an integer.
* @param  {Int} date  Integer to seed the PRNG
* @return {Set}       A set of ints corresponding to QUADS cards.
*/
export function daily(date) {
    // Hash the date
    let rand = mulberry32(hash(hash(date)));
  
    // SPAGHETTI CODE!!
    let res;
    while (true) {
        res = new Set();
        // The goal is to generate a subset with a lot of quads.
        // 2% of subsets of 7 elements have exactly 3 quads. 
        // We'll randomly pick 7 elements, then add whichever eighth creates the most quads.
        while (res.size < CARDS - 1)
            res.add(Math.floor(rand() * MAX));
        
        let q = nQuads(res);

        if (MIN_QUADS_INIT <= q && q <= MAX_QUADS_INIT)
            break;
    }

    // Add a card that makes lots of quads.
    let creates_quads = quasiExcludes(res);
    // We can't add a card already in here
    res.forEach(p => creates_quads[p] = -1);
    // Add the max
    res.add(indexOfMax(creates_quads));

    return { cards: res, n: nQuads(res) };

}

export function nQuads(cards) {

    let excludes = quasiExcludes(cards);

    let tot = 0;
    for (let q of cards)
        tot += excludes[q];

    return tot / 4;

}

/**
function nQuadsSmart(cards) {
    // This has better asymptotics in some cases:
    // it's O(s^2 + 2^d).
    // Whereas the other one is O(s^3),
    // but we often expect s to be around sqrt(2^d).
    //
    // Consider a method of doing this incrementally:
    // choose(n+1, 2) - choose(n, 2) = (n+1)(n) / 2 - n(n-1)/2 = n/2 * (n + 1 - (n - 1)) = n

    let tot = 0;
    let pts = new Array(MAX).fill(0);
    let ordered = Array.from(cards);
    for (let a = 0; a < ordered.length; a++) {
        for (let b = a + 1; b < ordered.length; b++) {
            tot += pts[ordered[a]^ordered[b]]++;
        }
    }

    return tot / 3;
    
}*/

export function quasiExcludes(cards) {
    let pts = new Array(MAX).fill(0);

    let ordered = Array.from(cards);
    for (let a = 0; a < ordered.length; a++) {
        for (let b = a + 1; b < ordered.length; b++) {
            for (let c = b + 1; c < ordered.length; c++) {
                pts[ordered[a]^ordered[b]^ordered[c]]++;   
            }
        }
    }
    return pts;
}

// https://stackoverflow.com/questions/521295/seeding-the-random-number-generator-in-javascript/47593316#47593316
// Very simple hash of an integer
function hash(number) {
    let t = (number + 250) ^ (Math.imul(number + 317, 372187)) >>> 16;
    t = Math.imul(t, 2246822507);
    t = Math.imul(t ^ t >>> 13, 3266489909);
    return t;
}
// seedable PRNG
function mulberry32(a) {
    return function() {
      var t = a += 0x6D2B79F5;
      t = Math.imul(t ^ t >>> 15, t | 1);
      t ^= t + Math.imul(t ^ t >>> 7, t | 61);
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    }
}

function indexOfMax(arr) {
    if (arr.length === 0) {
        return -1;
    }

    let max = arr[0];
    let maxIndex = 0;

    for (let i = 1; i < arr.length; i++) {
        if (arr[i] > max) {
            maxIndex = i;
            max = arr[i];
        }
    }

    return maxIndex;
}
