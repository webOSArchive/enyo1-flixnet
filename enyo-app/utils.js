function shuffleArray(arr) {
    var shuffled = arr.slice();
    for (var i = shuffled.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = shuffled[i];
        shuffled[i] = shuffled[j];
        shuffled[j] = temp;
    }
    return shuffled;
}

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function toPascalCase(string) {
    var words = string.split(/[^a-zA-Z0-9]+/);
    var result = '';
    for (var i = 0; i < words.length; i++) {
        if (words[i].length > 0) {
            result += words[i].charAt(0).toUpperCase() + words[i].slice(1);
        }
    }
    return result;
}