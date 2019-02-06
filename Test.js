var queue = [
    { t: [23, 21] },
    { t: [] },
];

var c = 0;
transition(0);

function transition(i) {
    console.log(queue);

    if (c > 1 && queue[i].t.length != 0) {
        console.log(queue[i].t.shift)
        var d = queue[i].t.shift();
        queue[i + 1].t.push(d);
    }

    c++;
    setTimeout(transition, 5000, i);
}

