import './style.css';

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
    <canvas id="game">Canvas failed to load. May be because you are using an outdated browser.</canvas>
    <p>FPS: <span id="fps">Loading...</span></p>
`;
const canvas: HTMLCanvasElement = document.querySelector('#game')!;

import { initializeApp } from 'firebase/app';
import { signInAnonymously, getAuth, onAuthStateChanged } from 'firebase/auth';
import { firebaseConfig } from './firebaseConfig';
import { getDatabase, ref, set, onDisconnect, onValue, onChildAdded } from 'firebase/database';
import { setupGl } from './glSetup';
//import emptyTextureUrl from './png/empty_texture.png'
import defaultCuboidTextureUrl from './png/default_cuboid.png';

import type { User } from 'firebase/auth';
import type { DatabaseReference, DataSnapshot } from 'firebase/database';
import { ScreenObject } from './ScreenObject';

//playButton.onClick = () => {
window.onload = () => {
    const firebaseApp = initializeApp(firebaseConfig);
    const auth = getAuth();

    let playerId: string;
    let playerRef: DatabaseReference;

    const glItems = setupGl();
    const myImage = new Image();
    myImage.src = defaultCuboidTextureUrl;

    // move this to a player.ts file soon!
    type PlayerBuildingData = {
        id: string,
        username: string,
        x: number,
        y: number,
        w: number,
        h: number,
        color: number[],
        // playerType: string, // for different player classes
    }

    function startGame() {
        const allPlayersRef = ref(getDatabase(firebaseApp), "players");
        // Weapon crates, powerups, whatever, just left here for when I add them.
        // const allCratesRef = ref(getDatabase(firebaseApp), "crates");

        onValue(allPlayersRef, (snapshot: DataSnapshot) => {
            // Fires when a change happens!

            // remove this return statement when this function is actually used
            return snapshot;
        });

        onChildAdded(allPlayersRef, (snapshot: DataSnapshot) => {
            // Fires when a new node is added.
            const addedPlayer: PlayerBuildingData = snapshot.val();
            //const playerObject = new Player(); ??

            if (addedPlayer.id == playerId) {
                // make name render as "You" with a different color or something.
                return;
            }
        });

        let animationFrameRequest = requestAnimationFrame(gameLoop);

        let frameCount = 0;
        const fpsCounter = setInterval(() => {
            const fpsElement: HTMLParagraphElement = document.querySelector("#fps")!;
            fpsElement.innerText = frameCount.toString();

            if (frameCount == 0) clearInterval(fpsCounter);

            frameCount = 0;
        }, 1000);

        let stopAnimation = false;
        document.addEventListener("keydown", (e: KeyboardEvent) => {
            if (e.key == " ") {
                stopAnimation = true;
            }
        });


        function sendPlayerData() {
            console.debug(playerId);
            mySet(playerRef, {
                id: playerId,
                username: localStorage.getItem("playerName") || "Unnamed",
                x: 0,
                y: 0,
                w: 0,
                h: 0,
                color: [0, 0, 0, 0]
            });
        }

        function gameLoop() {
            frameCount++;

            glItems.gl.clearColor(0, 0, 0, 0);
            glItems.gl.clear(glItems.gl.COLOR_BUFFER_BIT | glItems.gl.DEPTH_BUFFER_BIT);

            animationFrameRequest = requestAnimationFrame(gameLoop);

            // if (myPlayer.y > canvas.height - 50) {
            if (stopAnimation) {
                cancelAnimationFrame(animationFrameRequest);
                animationFrameRequest = -1;
            } else {
                console.log("drawing!");
            }

            sendPlayerData();
        }
    }

    function mySet(ref: DatabaseReference, value: PlayerBuildingData) {
        return set(ref, value);
    }

    onAuthStateChanged(auth, (user: User | null) => {
        console.debug(user);

        if (user) {
            playerId = user.uid;
            playerRef = ref(getDatabase(firebaseApp), "players/" + playerId);
            onDisconnect(playerRef).remove();

            // Everything is ready so now start game!
            startGame();
        } else {
            // no user
        }
    });

    signInAnonymously(auth).then(() => {
        console.debug("Successfully logged in!");
    }).catch((e) => {
        const errorCode = e.code;
        const errorMessage = e.message;

        // Make UI for errors at some point!
        console.error(errorCode + ": " + errorMessage);
    });
};
