import Matter from "matter-js";
import { useEffect, useRef } from "react";

interface PhysicsCanvasProps {
	width: number;
	height: number;
	onFrogClick: () => void;
	clickPower: number;
	goldenClicks: number;
}

export const PhysicsCanvas = ({
	width,
	height,
	onFrogClick,
	clickPower,
	goldenClicks,
}: PhysicsCanvasProps) => {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const engineRef = useRef<Matter.Engine | null>(null);
	const renderRef = useRef<Matter.Render | null>(null);
	const frogsRef = useRef<Matter.Body[]>([]);
	const mouseConstraintRef = useRef<Matter.MouseConstraint | null>(null);

	useEffect(() => {
		if (!canvasRef.current) return;

		// Create engine
		const engine = Matter.Engine.create();
		engine.world.gravity.y = 0.8;

		// Create renderer
		const render = Matter.Render.create({
			canvas: canvasRef.current,
			engine: engine,
			options: {
				width,
				height,
				wireframes: false,
				background: "transparent",
				showAngleIndicator: false,
				showVelocity: false,
			},
		});

		// Create boundaries
		const boundaries = [
			// Floor
			Matter.Bodies.rectangle(width / 2, height - 10, width, 20, {
				isStatic: true,
				render: { fillStyle: "rgba(74, 222, 128, 0.3)" },
			}),
			// Left wall
			Matter.Bodies.rectangle(10, height / 2, 20, height, {
				isStatic: true,
				render: { fillStyle: "rgba(74, 222, 128, 0.3)" },
			}),
			// Right wall
			Matter.Bodies.rectangle(width - 10, height / 2, 20, height, {
				isStatic: true,
				render: { fillStyle: "rgba(74, 222, 128, 0.3)" },
			}),
		];

		// Add boundaries to world
		Matter.World.add(engine.world, boundaries);

		// Create mouse constraint for interaction
		const mouseConstraint = Matter.MouseConstraint.create(engine, {
			mouse: Matter.Mouse.create(render.canvas),
			constraint: {
				stiffness: 0.2,
				render: { visible: false },
			},
		});

		Matter.World.add(engine.world, mouseConstraint);

		// Handle mouse clicks on frogs
		Matter.Events.on(mouseConstraint, "mousedown", (event) => {
			const mousePosition = event.mouse.position;
			const clickedBodies = Matter.Query.point(frogsRef.current, mousePosition);

			if (clickedBodies.length > 0) {
				onFrogClick();

				// Add visual feedback - make the frog jump
				const frog = clickedBodies[0];
				Matter.Body.applyForce(frog, frog.position, {
					x: (Math.random() - 0.5) * 0.02,
					y: -0.01 - Math.random() * 0.01,
				});

				// Change color briefly
				frog.render.fillStyle = goldenClicks > 0 ? "#fbbf24" : "#4ade80";
				setTimeout(() => {
					frog.render.fillStyle = "#16a34a";
				}, 200);
			}
		});

		// Function to create a frog body
		const createFrog = (x: number, y: number) => {
			const frog = Matter.Bodies.circle(x, y, 20 + Math.random() * 10, {
				restitution: 0.6,
				friction: 0.3,
				render: {
					fillStyle: "#16a34a",
					strokeStyle: "#15803d",
					lineWidth: 2,
				},
			});

			// Add some random initial velocity
			Matter.Body.setVelocity(frog, {
				x: (Math.random() - 0.5) * 2,
				y: -(Math.random() * 3 + 1),
			});

			return frog;
		};

		// Add initial frogs
		const initialFrogs = [];
		for (let i = 0; i < 5; i++) {
			const x = 50 + Math.random() * (width - 100);
			const y = height - 100 - Math.random() * 200;
			const frog = createFrog(x, y);
			initialFrogs.push(frog);
		}

		Matter.World.add(engine.world, initialFrogs);
		frogsRef.current = initialFrogs;

		// Start engine and renderer
		Matter.Engine.run(engine);
		Matter.Render.run(render);

		// Store references
		engineRef.current = engine;
		renderRef.current = render;
		mouseConstraintRef.current = mouseConstraint;

		return () => {
			if (renderRef.current) {
				Matter.Render.stop(renderRef.current);
			}
			if (engineRef.current) {
				Matter.Engine.clear(engineRef.current);
			}
		};
	}, [width, height, onFrogClick, goldenClicks]);

	// Add new frogs based on click power
	useEffect(() => {
		if (!engineRef.current || clickPower <= 1) return;

		const interval = setInterval(
			() => {
				if (frogsRef.current.length < 20) {
					// Limit max frogs for performance
					const x = 50 + Math.random() * (width - 100);
					const y = 50;
					const newFrog = Matter.Bodies.circle(x, y, 15 + Math.random() * 8, {
						restitution: 0.6,
						friction: 0.3,
						render: {
							fillStyle: goldenClicks > 0 ? "#fbbf24" : "#16a34a",
							strokeStyle: "#15803d",
							lineWidth: 2,
						},
					});

					Matter.Body.setVelocity(newFrog, {
						x: (Math.random() - 0.5) * 3,
						y: -(Math.random() * 2 + 1),
					});

					Matter.World.add(engineRef.current.world, newFrog);
					frogsRef.current.push(newFrog);
				}
			},
			2000 - Math.min(clickPower * 10, 1800),
		); // Spawn rate increases with click power

		return () => clearInterval(interval);
	}, [clickPower, width, goldenClicks]);

	// Clean up old frogs periodically
	useEffect(() => {
		const interval = setInterval(() => {
			if (frogsRef.current.length > 15) {
				const oldFrog = frogsRef.current.shift();
				if (oldFrog && engineRef.current) {
					Matter.World.remove(engineRef.current.world, oldFrog);
				}
			}
		}, 5000);

		return () => clearInterval(interval);
	}, []);

	return (
		<canvas
			ref={canvasRef}
			className="border-2 border-frog-green-400 rounded-lg bg-gradient-to-b from-blue-100 to-frog-green-100"
			style={{ cursor: "pointer" }}
		/>
	);
};
