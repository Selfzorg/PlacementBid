// script.js

// Utility function to get query parameters
function getQueryParams() {
    const params = {};
    const queryString = window.location.search.substring(1);
    const vars = queryString.split("&");
    vars.forEach(function(v) {
        const pair = v.split("=");
        params[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1] || '');
    });
    return params;
}

function adjustment(value) {
    let x = (value - 31) / 10;
    return x <= 0 ? 0 : Math.floor(x);
}

function solve(input) {
    const placementMultiplier = [2.5, 2.45, 2.4, 2.0];
    let ans = 0;

    for (let i = 0; i < 3; i++) {
        ans += input[i] * (placementMultiplier[i] - (adjustment(input[i]) * 0.3));
    }
    ans += input[3] * placementMultiplier[3];
    return ans;
}

// Function to handle form submission with password protection
function handleFormSubmission() {
    const form = document.getElementById('battle-form');
    const loading = document.getElementById('loading');

    form.addEventListener('submit', function(event) {
        event.preventDefault();

        // Retrieve the entered password
        const enteredPassword = document.getElementById('submit-password').value.trim();

        // Verify the password
        if (enteredPassword !== "BYECRITEO") {
            alert("Incorrect password. Submission denied.");
            return;
        }

        // Show loading
        loading.style.display = 'flex';

        // Collect team names
        const team1Name = document.getElementById('team1-name').value.trim() || 'Team 1';
        const team2Name = document.getElementById('team2-name').value.trim() || 'Team 2';

        // Collect team inputs (allowing decimals)
        const team1Inputs = [
            parseFloat(document.getElementById('team1-input1').value) || 0,
            parseFloat(document.getElementById('team1-input2').value) || 0,
            parseFloat(document.getElementById('team1-input3').value) || 0,
            parseFloat(document.getElementById('team1-input4').value) || 0
        ];

        const team2Inputs = [
            parseFloat(document.getElementById('team2-input1').value) || 0,
            parseFloat(document.getElementById('team2-input2').value) || 0,
            parseFloat(document.getElementById('team2-input3').value) || 0,
            parseFloat(document.getElementById('team2-input4').value) || 0
        ];

        // Calculate sums
        for(let i=0; i<4; i++){
            if(team1Inputs[i] > team2Inputs[i]){
                team2Inputs[i]=0;
            }
            else if(team2Inputs[i] > team1Inputs[i]){
                team1Inputs[i] =0;
            }
            else{
                team1Inputs[i]=0;
                team2Inputs[i]=0;
            }
        }
        
        const team1Sum = solve(team1Inputs);
        const team2Sum = solve(team2Inputs);

        // Determine winner
        let winner = '';
        let reasoning = '';

        if (team1Sum > team2Sum) {
            winner = `${team1Name} Wins!`;
            reasoning = `${team1Name} has a higher total score (${team1Sum.toFixed(2)}) than ${team2Name} (${team2Sum.toFixed(2)}).`;
            updateLeaderboard(team1Name, team1Sum);
        } else if (team2Sum > team1Sum) {
            winner = `${team2Name} Wins!`;
            reasoning = `${team2Name} has a higher total score (${team2Sum.toFixed(2)}) than ${team1Name} (${team1Sum.toFixed(2)}).`;
            updateLeaderboard(team2Name, team2Sum);
        } else {
            winner = `It's a Tie!`;
            reasoning = `Both ${team1Name} and ${team2Name} have equal total scores (${team1Sum.toFixed(2)}).`;
        }

        // Simulate processing delay
        setTimeout(() => {
            // Hide loading
            loading.style.display = 'none';

            // Redirect to result page with query parameters
            const params = new URLSearchParams({
                winner: winner,
                reasoning: reasoning
            });
            window.location.href = `result.html?${params.toString()}`;
        }, 2000); // 2 seconds delay
    });
}

// Function to update the leaderboard in localStorage
function updateLeaderboard(winningTeam, score) {
    let leaderboard = JSON.parse(localStorage.getItem('leaderboard')) || {};

    if (leaderboard[winningTeam]) {
        leaderboard[winningTeam].wins += 1;
        // Update bestScore if current score is higher
        if (score > leaderboard[winningTeam].bestScore) {
            leaderboard[winningTeam].bestScore = score;
        }
    } else {
        leaderboard[winningTeam] = {
            wins: 1,
            bestScore: score
        };
    }

    localStorage.setItem('leaderboard', JSON.stringify(leaderboard));
}

// Function to migrate existing leaderboard data to include bestScore
function migrateLeaderboardData(leaderboard) {
    let updated = false;
    Object.keys(leaderboard).forEach(team => {
        if (typeof leaderboard[team].bestScore !== 'number') {
            leaderboard[team].bestScore = 0;
            updated = true;
        }
        if (typeof leaderboard[team].wins !== 'number') {
            leaderboard[team].wins = 0;
            updated = true;
        }
    });
    if (updated) {
        localStorage.setItem('leaderboard', JSON.stringify(leaderboard));
    }
}

// Function to display results on the result page
function displayResults() {
    const params = getQueryParams();
    const resultDiv = document.getElementById('result');

    if (!params.winner || !params.reasoning) {
        // If no data is passed, redirect back to main page
        window.location.href = 'index.html';
        return;
    }

    // Display winner and reasoning
    document.getElementById('winner').textContent = params.winner;
    document.getElementById('reasoning').textContent = params.reasoning;
    resultDiv.style.display = 'block';

    // Trigger fireworks if there's a clear winner
    if (!params.winner.includes('Tie')) {
        launchFireworks();
    }

    // Handle back button
    const backBtn = document.getElementById('back-btn');
    backBtn.addEventListener('click', () => {
        window.location.href = 'index.html';
    });
}

// Function to display the leaderboard
function displayLeaderboard() {
    const leaderboardBody = document.getElementById('leaderboard-body');
    let leaderboard = JSON.parse(localStorage.getItem('leaderboard')) || {};

    // Migrate data if necessary
    migrateLeaderboardData(leaderboard);

    // Convert leaderboard object to array and sort by wins and then bestScore
    let sortedLeaderboard = Object.keys(leaderboard).map(team => {
        return { 
            team: team, 
            wins: typeof leaderboard[team].wins === 'number' ? leaderboard[team].wins : 0, 
            bestScore: typeof leaderboard[team].bestScore === 'number' ? leaderboard[team].bestScore : 0 
        };
    });

    sortedLeaderboard.sort((a, b) => {
        if (b.wins === a.wins) {
            return b.bestScore - a.bestScore; // If wins are equal, sort by bestScore
        }
        return b.wins - a.wins;
    });

    // Get top 10 teams
    sortedLeaderboard = sortedLeaderboard.slice(0, 10);

    // Clear existing leaderboard entries
    leaderboardBody.innerHTML = '';

    // Populate the table
    sortedLeaderboard.forEach((entry, index) => {
        const row = document.createElement('tr');

        const rankCell = document.createElement('td');
        rankCell.textContent = index + 1;
        row.appendChild(rankCell);

        const teamCell = document.createElement('td');
        teamCell.textContent = entry.team;
        row.appendChild(teamCell);

        const winsCell = document.createElement('td');
        winsCell.textContent = entry.wins;
        row.appendChild(winsCell);

        const scoreCell = document.createElement('td');
        const bestScore = typeof entry.bestScore === 'number' ? entry.bestScore : 0;
        scoreCell.textContent = bestScore.toFixed(2);
        row.appendChild(scoreCell);

        leaderboardBody.appendChild(row);
    });

    // Handle back button
    const backBtn = document.getElementById('back-btn');
    backBtn.addEventListener('click', () => {
        window.location.href = 'index.html';
    });

    // Handle delete button
    const deleteBtn = document.getElementById('delete-btn');
    deleteBtn.addEventListener('click', () => {
        // Prompt user for password
        const password = prompt("Enter password to delete the leaderboard:");

        if (password === null) {
            // User cancelled the prompt
            return;
        }

        if (password === "DELETEIT") {
            const confirmation = confirm("Are you sure you want to delete the leaderboard? This action cannot be undone.");
            if (confirmation) {
                // Clear the leaderboard from localStorage
                localStorage.removeItem('leaderboard');

                // Clear the table display
                leaderboardBody.innerHTML = '';

                alert("Leaderboard has been successfully deleted.");
            } else {
                // User cancelled the deletion
                alert("Leaderboard deletion has been canceled.");
            }
        } else {
            // Incorrect password
            alert("Incorrect password. Leaderboard deletion failed.");
        }
    });
}

// Fireworks Implementation
function launchFireworks() {
    const canvas = document.getElementById('fireworks-canvas');
    const ctx = canvas.getContext('2d');
    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;

    const fireworks = [];
    const particles = [];
    const maxFireworks = 15; // Increased number of simultaneous fireworks
    let lastLaunch = 0;

    function random(min, max) {
        return Math.random() * (max - min) + min;
    }

    function Firework(x, y, targetX, targetY) {
        this.x = x;
        this.y = y;
        this.targetX = targetX;
        this.targetY = targetY;
        this.speed = random(3, 6); // Increased speed for more dynamic fireworks
        this.angle = Math.atan2(targetY - y, targetX - x);
        this.distanceTraveled = 0;
        this.distanceToTarget = Math.hypot(targetX - x, targetY - y);
        this.coordinates = [];
        this.coordinateCount = 5;
        while(this.coordinateCount--) {
            this.coordinates.push([this.x, this.y]);
        }
    }

    Firework.prototype.update = function() {
        this.coordinates.pop();
        this.coordinates.unshift([this.x, this.y]);

        const vx = Math.cos(this.angle) * this.speed;
        const vy = Math.sin(this.angle) * this.speed;
        this.x += vx;
        this.y += vy;
        this.distanceTraveled += Math.hypot(vx, vy);

        if(this.distanceTraveled >= this.distanceToTarget) {
            createParticles(this.targetX, this.targetY);
            return true;
        }
        return false;
    }

    Firework.prototype.draw = function(ctx) {
        ctx.beginPath();
        ctx.moveTo(this.coordinates[this.coordinates.length -1][0], this.coordinates[this.coordinates.length -1][1]);
        ctx.lineTo(this.x, this.y);
        ctx.strokeStyle = '#FF5733'; // Vibrant color for better visibility
        ctx.stroke();
    }

    function Particle(x, y) {
        this.x = x;
        this.y = y;
        this.speed = random(1, 10); // Increased speed for more dynamic particles
        this.angle = random(0, Math.PI * 2);
        this.gravity = 0.15; // Increased gravity for faster descent
        this.friction = 0.95;
        this.decay = random(0.005, 0.015);
        this.color = `hsl(${Math.floor(random(0, 360))}, 100%, 50%)`;
        this.opacity = 1;
        this.coordinates = [];
        this.coordinateCount = 5;
        while(this.coordinateCount--) {
            this.coordinates.push([this.x, this.y]);
        }
    }

    Particle.prototype.update = function() {
        this.coordinates.pop();
        this.coordinates.unshift([this.x, this.y]);
        this.speed *= this.friction;
        this.x += Math.cos(this.angle) * this.speed;
        this.y += Math.sin(this.angle) * this.speed + this.gravity;
        this.opacity -= this.decay;
    }

    Particle.prototype.draw = function(ctx) {
        ctx.beginPath();
        ctx.moveTo(this.coordinates[this.coordinates.length -1][0], this.coordinates[this.coordinates.length -1][1]);
        ctx.lineTo(this.x, this.y);
        ctx.strokeStyle = `rgba(${hexToRgb(this.color)}, ${this.opacity})`;
        ctx.stroke();
    }

    function createParticles(x, y) {
        const count = 50; // Increased number of particles per explosion
        while(count--) {
            particles.push(new Particle(x, y));
        }
    }

    function hexToRgb(h) {
        // Convert HSL to RGB
        // h is a hsl string like 'hsl(120, 100%, 50%)'
        const result = /hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/.exec(h);
        if (!result) return '0,0,0';
        let hue = parseInt(result[1]);
        let saturation = parseInt(result[2]) / 100;
        let lightness = parseInt(result[3]) / 100;

        let c = (1 - Math.abs(2 * lightness - 1)) * saturation;
        let xVal = c * (1 - Math.abs((hue / 60) % 2 - 1));
        let m = lightness - c/2;
        let r=0, g=0, b=0;

        if (0 <= hue && hue < 60) {
            r = c; g = xVal; b =0;
        } else if (60 <= hue && hue < 120) {
            r = xVal; g = c; b =0;
        } else if (120 <= hue && hue < 180) {
            r =0; g = c; b =xVal;
        } else if (180 <= hue && hue < 240) {
            r =0; g =xVal; b =c;
        } else if (240 <= hue && hue < 300) {
            r =xVal; g =0; b =c;
        } else if (300 <= hue && hue < 360) {
            r =c; g =0; b =xVal;
        }

        r = Math.round((r + m) * 255);
        g = Math.round((g + m) * 255);
        b = Math.round((b + m) * 255);

        return `${r},${g},${b}`;
    }

    function updateFireworks() {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, width, height);
        ctx.globalCompositeOperation = 'lighter';

        let i = fireworks.length;
        while(i--) {
            if(fireworks[i].update()) {
                fireworks.splice(i, 1);
            }
        }

        i = particles.length;
        while(i--) {
            particles[i].update();
            if(particles[i].opacity <= 0) {
                particles.splice(i, 1);
            }
        }

        fireworks.forEach(firework => firework.draw(ctx));
        particles.forEach(particle => particle.draw(ctx));

        requestAnimationFrame(updateFireworks);
    }

    // Start the animation loop
    updateFireworks();

    // Function to launch fireworks
    function launchFireworks() {
        // Launch fireworks at intervals
        let launchInterval = setInterval(() => {
            if (fireworks.length < maxFireworks) {
                const x = random(0, width);
                const y = random(height * 0.2, height * 0.5);
                fireworks.push(new Firework(random(width * 0.3, width * 0.7), height, x, y));
            }
        }, 300); // Increased frequency

        // Stop fireworks after 7 seconds
        setTimeout(() => {
            clearInterval(launchInterval);
            // Allow existing particles to finish
            setTimeout(() => {
                canvas.style.display = 'none';
            }, 7000);
        }, 7000);

        canvas.style.display = 'block';
    }
}
// Initialize scripts based on the current page
function initialize() {
    if (document.getElementById('battle-form')) {
        handleFormSubmission();
    }

    if (document.getElementById('result')) {
        displayResults();
    }

    if (document.getElementById('leaderboard-body')) {
        displayLeaderboard();
    }
}

// Run initialize on DOMContentLoaded
document.addEventListener('DOMContentLoaded', initialize);
