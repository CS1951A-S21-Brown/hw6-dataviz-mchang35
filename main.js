// Add your JavaScript code here
const MAX_WIDTH = Math.max(1200, window.innerWidth);
const MAX_HEIGHT = 720;
const margin = {top: 40, right: 100, bottom: 40, left: 200};

// Assumes the same graph width, height dimensions as the example dashboard. Feel free to change these if you'd like
let graph_1_width = (MAX_WIDTH / 2) - 10, graph_1_height = 350;
let graph_2_width = (MAX_WIDTH / 2) - 10, graph_2_height = 275;
let graph_3_width = MAX_WIDTH / 2, graph_3_height = 600;

// other constants:
const MIN_YEAR = 1925;
const MAX_YEAR = 2020;
const MIN_YEAR_RUNTIME = 1975;
const DEFAULT_0_THRESHOLD = 6; // default threshold for number of movies
const DEFAULT_1_THRESHOLD = 125; // default threshold for number of connections
const FADE_COLORS = ["#aa7dce", "#f4a5ae"];
const NUM_EXAMPLES = 20;
const DOT_COLORS = "#3b429f";
const DOT_MOUSEOVER_COLORS = "#d063f7";
const DOT_R = 4;
const DOT_MOUSEOVER_R = 6;
const NODE_COLORS = "#a8577e";
const NODE_MOUSEOVER_COLORS = "#aa7dce";
const NODE_ORIG_R = 7;
const NODE_MOUSEOVER_R = 10;
const LINK_MOUSEOVER_COLOR = "#0f6afc";
const LINK_ORIG_WIDTH = 2;

// make an svg for each graph
let svg1 = d3.select("#graph1")
    .append("svg");

let svg2 = d3.select("#graph2")
    .append("svg")
    .attr("width", graph_2_width)
    .attr("height", graph_2_height)
    .append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`)
    .attr("align", "center");

let svg3 = d3.select("#graph3")
    .append("svg");

// graph 1: bar chart for count of top genres
function setYear(start_year=MIN_YEAR, end_year=MAX_YEAR) {
    d3.csv("../data/netflix.csv").then(function(data) { // for the genre data
        data = getGenreData(data, start_year, end_year);
        if (data == -1) {
            svg1 = clearAndReplaceSVG("#graph1");
            svg1.append("text")
                .attr("id", "warning")
                .text("The starting year must be before or equal to the ending year!")
                .attr("transform", `translate(${graph_1_width / 2 - 400}, 
                    ${(graph_1_height - margin.top - margin.bottom) / 2 - 20})`);
            return;
        }
        // remove old data
        d3.select("#warning").remove();
        svg1 = clearAndReplaceSVG("#graph1");

        let x = d3.scaleLinear() // x = counts
            .domain([0, d3.max(data, function(d) {return d.count})])
            .range([0, graph_1_width - margin.left - margin.right]);
        let y = d3.scaleBand() // y = genres
            .domain(data.map(function(d) {return d.genre}))
            .range([0, graph_1_height - margin.top - margin.bottom])
            .padding(0.1);
        svg1.append("g").call(d3.axisLeft(y).tickSize(0).tickPadding(10));

        let color = d3.scaleOrdinal()
            .range(d3.quantize(d3.interpolateHcl(FADE_COLORS[0], FADE_COLORS[1]), NUM_EXAMPLES));

        let bars = svg1.selectAll("rect").data(data);

        bars.enter()
            .append("rect")
            .merge(bars)
            .attr("fill", function(d) {return color(d.genre)})
            .attr("x", x(0))
            .attr("y", function(d) {return y(d.genre)})
            .attr("width", function(d) {return x(d.count)})
            .attr("height", y.bandwidth());

        let countRef = svg1.append("g");
        let counts = countRef.selectAll("text").data(data);
        counts.enter()
            .append("text")
            .merge(counts)
            .attr("x", function(d) {return x(d.count) + 5})
            .attr("y", function(d) {return y(d.genre) + 11})
            .style("text-anchor", "start")
            .style("font-size", 12)
            .text(function(d) {return d.count});

        // x-axis label
        svg1.append("text")
            .attr("transform", `translate(${graph_1_width / 2 - margin.right - 10},
                ${graph_1_height - margin.bottom - 20})`)
            .attr("text-anchor", "middle")
            .text("Count");

        // y-axis label
        svg1.append("text")
            .style("text-anchor", "end")
            .attr("dy", ".75em")
            .attr("y", -160)
            .attr("transform", "rotate(-90)")
            .text("Genre");

        // chart title
        let title = svg1.append("text")
            .attr("transform", `translate(${graph_1_width / 2 - margin.right}, -20)`)
            .style("text-anchor", "middle")
            .style("font-size", 15)
            .text("Top 20 Genres on Netflix (" + start_year + "-" + end_year + ")");

        bars.exit().remove();
        counts.exit().remove();

    });
}

// graph 2: scatter plot with tooltip for average runtime by release year
d3.csv("../data/netflix.csv").then(function(data) { // for the runtime data
    data = getRuntimeData(data);
    let extent = d3.extent(data, function(d) {return Date.parse(d.year)});
    let x = d3.scaleTime()
        .domain(extent)
        .range([0, graph_2_width - margin.left - margin.right]);
    svg2.append("g")
        .attr("class", "x axis")
        .attr("transform", `translate(0, ${graph_2_height})`)
        .call(d3.axisBottom(x).tickFormat(d3.timeFormat("%Y")).ticks(3));
    let y = d3.scaleLinear()
        .domain([d3.max(data, function(d) {return d.avg_runtime}), 0])
        .range([0, graph_2_height - margin.top - margin.bottom]);
    svg2.append("g").call(d3.axisLeft(y).tickSize(2).tickPadding([10]));

    let tooltip = d3.select("#graph2")
        .append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);

    let dots = svg2.selectAll("dot").data(data);
    dots.enter()
        .append("circle")
        .attr("fill", DOT_COLORS)
        .attr("cx", function(d) {return x(Date.parse(d.year))})
        .attr("cy", function(d) {return y(d.avg_runtime)})
        .attr("r", DOT_R)
        .on("mouseover", function(d) {
            let html = `Year: ${d.year}</span><br/>Average Runtime: ${Math.round(d.avg_runtime)} minutes</span>`;
            tooltip.html(html)
                .style("left", `${(Math.max(margin.left + 200, Math.min(d3.event.pageX + 100, graph_2_width)))}px`)
                .style("top", `${d3.event.pageY - 50}px`)
                .transition()
                .duration(100)
                .style("opacity", 1);
            d3.select(this).attr("fill", DOT_MOUSEOVER_COLORS).attr("r", DOT_MOUSEOVER_R);
        })
        .on("mouseout", function(d) {
            tooltip.transition()
                .duration(200)
                .style("opacity", 0);
            d3.select(this).attr("fill", DOT_COLORS).attr("r", DOT_R);
        });

    // x-axis label
    svg2.append("text")
        .attr("transform", `translate(${graph_2_width / 2 - margin.right - 50}, ${graph_2_height - margin.bottom - 20})`)
        .style("text-anchor", "middle")
        .text("Year");

    // y-axis label
    svg2.append("text")
        .style("text-anchor", "end")
        .attr("transform", `rotate(-90)`)
        .attr("dy", ".75em")
        .attr("y", -60)
        .text("Average Runtime (Minutes)");

    // chart title
    svg2.append("text")
        .attr("transform", `translate(${graph_2_width / 2 - 1.5*margin.right}, -20)`)
        .style("text-anchor", "middle")
        .text("Average Runtime of Movies by Release Year (" + MIN_YEAR_RUNTIME + "-2020)")
        .style("font-size", 15);
});

// graph 3: network graph representing actor/actor pairs
function setCriteriaForActorData(criteria=0) { // 0: by number of movies together; 1: by number of connections
    let threshold = DEFAULT_0_THRESHOLD;
    if (criteria != 0) {
        threshold = DEFAULT_1_THRESHOLD;
    }
    d3.csv("../data/netflix.csv").then(function(data) { // for the actor data
        data = getActorData(data, criteria, threshold);

        svg3 = clearAndReplaceSVG("#graph3");

        let tooltip = d3.select("#graph3")
            .append("div")
            .attr("class", "tooltip")
            .style("opacity", 0);

        // guided by: https://www.d3-graph-gallery.com/graph/network_basic.html
        let simulation = d3.forceSimulation(data.nodes)
            .force("link", d3.forceLink()
                .id(function(d) {return d.name})
                .links(data.links)
                .distance([100])
                .strength(.35)
            )
            .force("charge", d3.forceManyBody().strength(-30))
            .force("center", d3.forceCenter(graph_3_width / 2 - 200, graph_2_height / 2 + 100))
            .force("collision", d3.forceCollide().radius(2 * DOT_R))
            .force("gravity", gravity(0.10))
            .on("tick", ticked);

        function gravity(alpha) {
            return function(d) {
                d.y = d.y + (d.cy - d.y) * alpha;
                d.x = d.x + (d.cx - d.x) * alpha;
            }
        }

        // drag functions with guidance from: http://bl.ocks.org/norrs/2883411
        let dragstart = function() {
            simulation.stop();
        }
        let dragmove = function(d) {
            d.px = d.px + d3.event.dx;
            d.py = d.py + d3.event.dy;
            d.x = d.x + d3.event.dx;
            d.y = d.y + d3.event.dy;
            ticked();
        }
        let dragend = function(d) {
            simulation.alphaTarget(0.1).alphaDecay(0.01);
            simulation.alpha(0.20).restart();
            ticked();
        }
        let node_drag = d3.drag()
            .on("start", dragstart)
            .on("drag", dragmove)
            .on("end", dragend);

        function tooltipLeft() {
            let l = Math.max(
                DOT_R + 250,
                Math.min(
                    graph_3_width - DOT_R + 300,
                    d3.event.pageX - 10));
            return l;
        }
        function tooltipTop() {
            let t = Math.min(
                d3.event.pageY - graph_1_height - graph_2_height - 200,
                graph_3_height - margin.bottom);
            return t;
        }
        function numMovies(d) {
            if (d.num_movies > 1) {
                return String(d.num_movies) + ' titles';
            }
            return String(d.num_movies) + ' title';
        }

        let links = svg3.append("g")
            .selectAll("line")
            .data(data.links)
            .enter()
            .append("line")
            .attr("stroke-width", LINK_ORIG_WIDTH)
            .style("stroke", "black")
            .on("mouseover", function(d) {
                let html = `${d.source.name} & ${d.target.name}<br/>${numMovies(d)}`;
                let mouse = d3.mouse(this);
                tooltip.html(html)
                    .style("left", `${tooltipLeft()}}px`)
                    .style("top", `${tooltipTop() + 10}px`)
                    .transition()
                    .duration(100)
                    .style("opacity", 1);
                d3.select(this)
                    .style("stroke-width", 2 * LINK_ORIG_WIDTH)
                    .style("stroke", LINK_MOUSEOVER_COLOR);
            })
            .on("mouseout", function(d) {
                tooltip.transition()
                    .duration(200)
                    .style("opacity", 0);
                d3.select(this)
                    .style("stroke-width", LINK_ORIG_WIDTH)
                    .style("stroke", "black");
            });

        let nodes = svg3.append("g")
            .selectAll("circle")
            .data(data.nodes)
            .enter()
            .append("circle")
            .attr("r", NODE_ORIG_R)
            .attr("fill", NODE_COLORS)
            .on("mouseover", function(d) {
                let html = `${d.name}`;
                let mouse = d3.mouse(this);
                console.log("node x: " + mouse[0]);
                console.log("node y: " + mouse[1]);
                tooltip.html(html)
                    .style("left", `${tooltipLeft()}px`)
                    .style("top", `${tooltipTop() + 10}px`)
                    .transition()
                    .duration(100)
                    .style("opacity", 1);
                d3.select(this).attr("r", NODE_MOUSEOVER_R).style("fill", NODE_MOUSEOVER_COLORS);
            })
            .on("mouseout", function(d) {
                tooltip.transition()
                    .duration(200)
                    .style("opacity", 0);
                d3.select(this).attr("r", NODE_ORIG_R).style("fill", NODE_COLORS);
            })
            .call(node_drag);

        function ticked() {
            nodes.attr("cx", function(d) {return d.x = Math.max(DOT_R - 150, Math.min(graph_3_width - DOT_R - margin.right - 110, d.x))})
                .attr("cy", function(d) {return d.y = Math.max(DOT_R, Math.min(graph_3_height - DOT_R - 100, d.y))});
            links.attr("x1", function(d) {return d.source.x})
                .attr("y1", function(d) {return d.source.y})
                .attr("x2", function(d) {return d.target.x})
                .attr("y2", function(d) {return d.target.y});
        }

        // chart title
        let title = svg3.append("text")
            .attr("transform", `translate(${graph_3_width / 2 - 2*margin.right}, -20)`)
            .style("text-anchor", "middle")
            .style("font-size", 15);
        if (criteria == 0) {
            title.text("Actors Who Starred In " + threshold + " Or More Titles (Films/TV Shows) Together");
        } else {
            title.text("Actors Who Have More Than " + threshold + " Connections");
        }
    });
}

// function for cleaning and retrieving data for the genre bar chart
function getGenreData(data, start_year, end_year) {
    if (end_year < start_year) {
        return -1;
    }
    var genres = {};
    for (let i = 0; i < data.length; i++) {
        if (parseInt(data[i].release_year) < start_year || parseInt(data[i].release_year) > end_year) {
            continue;
        }
        let listed_genres = data[i].listed_in.split(", ");
        for (let j = 0; j < listed_genres.length; j++) {
            let curr_genre = listed_genres[j];
            if (curr_genre in genres) {
                genres[curr_genre] = genres[curr_genre] + 1;
            } else {
                genres[curr_genre] = 1;
            }
        }
    }
    // make genres into an array
    genres_array = [];
    for (var genre in genres) {
        let genre_dict = {"genre": genre, "count": genres[genre]};
        genres_array.push(genre_dict);
    }
    genres_array = genres_array.sort(function(genre1, genre2) {return genre2.count - genre1.count})
        .slice(0, NUM_EXAMPLES);
    return genres_array;
}

// function for cleaning and retrieving data for the average runtime scatter plot
function getRuntimeData(data) {
    let all_runtimes = {}; // key: year, value: array of runtimes for that year
    for (let i = 0; i < data.length; i++) {
        let curr_movie = data[i];
        let curr_movie_year = parseInt(curr_movie.release_year);
        if (curr_movie.type == 'Movie' && curr_movie_year >= MIN_YEAR_RUNTIME) {
            let runtime = curr_movie.duration.split(' ')[0];
            if (curr_movie_year in all_runtimes) {
                all_runtimes[curr_movie_year] = all_runtimes[curr_movie_year] + ", " + runtime;
            } else {
                all_runtimes[curr_movie_year] = runtime;
            }
        }
    }
    let avg_runtimes_array = []; // array of {year, average_runtime}
    for (year in all_runtimes) {
        let runtimes = all_runtimes[year].split(', ');
        let total_movies = 0;
        let sum = 0;
        for (let i = 0; i < runtimes.length; i++) {
            sum = sum + parseInt(runtimes[i]);
            total_movies = total_movies + 1;
        }
        let avg_runtime = sum / total_movies;
        let yr_dict = {"year": year, "avg_runtime": avg_runtime};
        avg_runtimes_array.push(yr_dict);
    }
    return avg_runtimes_array;
}

// function for cleaning and retrieving data for the actors network graph
function getActorData(data, criteria, threshold) {
    // need to have data in form: {nodes [{name}], links [{source, target}]}
    let pairs_by_actor = {};
    // dictionary in the form of: {actor1: {actor2: movie_count, actor3: movie_countg,...},...}
    for (let i = 0; i < data.length; i++) {
        let curr_movie = data[i];
        let actors = curr_movie.cast.split(', ');
        for (let j = 0; j < actors.length; j++) {
            let actor1 = actors[j];
            for (let k = (j+1); k < actors.length; k++) {
                let actor2 = actors[k];
                    updatePairsByActor(actor1, actor2, pairs_by_actor);
                    updatePairsByActor(actor2, actor1, pairs_by_actor);
            }
        }
    }
    let links = [];
    // list of distinct pairs of actors with the number of movies they've been in together
    var actors_to_include = new Set();
    actors_to_include.clear();
    for (let actor1 in pairs_by_actor) {
        let actors_from_actor1 = pairs_by_actor[actor1]; // = dictionary
        if (criteria == 1 &&
                Object.keys(actors_from_actor1).length < threshold) {
            continue;
        }
        for (let actor2 in actors_from_actor1) {
            let actors_from_actor2 = pairs_by_actor[actor2];
            if (criteria == 1 &&
                    Object.keys(actors_from_actor2).length < threshold) {
                continue;
            }
            let num_movies = actors_from_actor1[actor2];
            if (criteria == 0 && num_movies < threshold) {
                continue;
            }
            let dict = {"source": actor1, "target": actor2, "num_movies": num_movies};
            links.push(dict);
            actors_to_include.add(actor1).add(actor2);
        }
    }
    let nodes = [];
    for (let actor of actors_to_include) {
        nodes.push({"name": actor});
    }
    return {"nodes": nodes, "links": links};
}

// helper function used in getActorData for adding actor pairs to a dictionary
function updatePairsByActor(actor1, actor2, pairs_by_actor) {
    let actor1_dict = {};
    if (actor1 in pairs_by_actor) {
        actor1_dict = pairs_by_actor[actor1];
    }
    if (actor2 in actor1_dict) {
        actor1_dict[actor2] = actor1_dict[actor2] + 1;
    } else {
        actor1_dict[actor2] = 1;
    }
    pairs_by_actor[actor1] = actor1_dict;
}

// helper function used to change bar graph (graph 1) based on year range selected by user
function getSelectedYearsAndMakeGraph() {
    let start_year = document.getElementById("years_start").value;
    let end_year = document.getElementById("years_end").value;
    setYear(start_year=start_year, end_year=end_year);
}

// helper function used to clear and replace an SVG
function clearAndReplaceSVG(graph_str) {
    d3.select(graph_str).select("svg").remove();
    let svg = d3.select(graph_str);
    if (graph_str == "#graph1") {
        svg = svg
            .append("svg")
            .attr("width", graph_1_width)
            .attr("height", graph_1_height)
            .append("g")
            .attr("transform", `translate(${margin.left}, ${margin.top})`)
            .attr("align", "center");
    } else {
        svg = svg
            .append("svg")
            .attr("width", graph_3_width)
            .attr("height", graph_3_height)
            .append("g")
            .attr("transform", `translate(${margin.left}, ${margin.top})`)
            .attr("align", "center");
    }
    return svg;
}

// We want the default first and third graphs to show up
setYear();
setCriteriaForActorData();