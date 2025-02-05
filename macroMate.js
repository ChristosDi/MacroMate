document.addEventListener("DOMContentLoaded", async () => {
  // Initialize Three.js background with additional planets arranged in a circle
  initThreeJS();

  const buttonContainer = document.querySelector(".button-container");
  const displayContainer = document.getElementById("display");

  // Fetch macros from JSON file
  const macrosData = await fetchMacros();
  if (!macrosData || !macrosData.data) return;

  // Create a button for each category using the "name" property from the JSON
  macrosData.data.forEach(categoryObj => {
    const button = document.createElement("button");
    button.textContent = categoryObj.name;
    button.addEventListener("click", () => {
      const category = categoryObj.name;
      // Filter out items that have non-empty macro (any property ending with "Macro") or non-empty comboMemo
      const nonEmptyItems = categoryObj.items.filter(item => {
        const macroKey = getMacroKey(item);
        return (macroKey && item[macroKey].trim() !== "") ||
               (item.comboMemo && item.comboMemo.trim() !== "");
      });

      if (nonEmptyItems.length > 0) {
        displayMacro(nonEmptyItems);
      } else {
        displayContainer.innerHTML = `<div class="title">No content available for ${category}</div>`;
      }
    });
    buttonContainer.appendChild(button);
  });

  // Fetch macros.json file
  async function fetchMacros() {
    try {
      const response = await fetch("macros.json");
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error("Error fetching macros:", error);
      displayContainer.innerHTML = `<div class="title">Error Loading Macros</div>`;
      return { data: [] };
    }
  }

  // Helper function: returns the first key that ends with "Macro" and has non-empty content
  function getMacroKey(item) {
    for (let key in item) {
      if (key.endsWith("Macro") && item[key] && item[key].trim() !== "") {
        return key;
      }
    }
    return null;
  }

  // Display macro and memo content with copy buttons.
  // Layout: Title on top, then a row with macro on left and memo on right.
  function displayMacro(macroItems) {
    let macroContent = macroItems.map(macro => {
      const macroKey = getMacroKey(macro);
      const macroText = macroKey ? (macro[macroKey] || "No macro available") : "No macro available";
      const memoText = macro.comboMemo || "No memo available";
      return `
        <div class="macro-block">
          <div class="item-title">${macro.title || "Untitled"}</div>
          <div class="item-content">
            <div class="macro">
              <div class="macro-text">${macroText.replace(/\n/g, '<br>')}</div>
              <button class="copy-button copy-macro" data-copy="${macroText.replace(/\n/g, ' ')}" onclick="copyToClipboard(this)">📋</button>
            </div>
            <div class="memo">
              <div class="memo-text">${memoText.replace(/\n/g, '<br>')}</div>
              <button class="copy-button copy-memo" data-copy="${memoText.replace(/\n/g, ' ')}" onclick="copyToClipboard(this)">📋</button>
            </div>
          </div>
        </div>
      `;
    }).join("");

    displayContainer.innerHTML = macroContent 
      ? `<div class="content">${macroContent}</div>` 
      : `<div class="title">No content to display</div>`;
  }

  // Global copy function for inline onclick handlers
  window.copyToClipboard = function(button) {
    const text = button.getAttribute("data-copy");
    navigator.clipboard.writeText(text).then(() => {
      button.textContent = "Copied!";
      setTimeout(() => {
        button.textContent = "📋";
      }, 2000);
    }).catch(err => {
      console.error("Failed to copy text: ", err);
    });
  };

  // Initialize a Three.js scene with a star field and seven planets arranged in a circle
  function initThreeJS() {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75, window.innerWidth / window.innerHeight, 0.1, 1000
    );
    // Move the camera farther back to view the larger system
    camera.position.z = 30;

    const renderer = new THREE.WebGLRenderer({ alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setClearColor(0x000000, 0); // Transparent background over underlying black
    renderer.domElement.style.position = "fixed";
    renderer.domElement.style.top = "0";
    renderer.domElement.style.left = "0";
    renderer.domElement.style.zIndex = "-1"; // Render behind other elements
    document.body.appendChild(renderer.domElement);

    // Star field
    const starsCount = 10000;
    const positions = new Float32Array(starsCount * 3);
    for (let i = 0; i < starsCount * 3; i++) {
      positions[i] = (Math.random() - 0.5) * 2000;
    }
    const starsGeometry = new THREE.BufferGeometry();
    starsGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const starsMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 0.7 });
    const starField = new THREE.Points(starsGeometry, starsMaterial);
    scene.add(starField);

    // Planet definitions (seven planets arranged on a circle)
    const planets = [
      { name: "Mercury", texture: "images/2k_mercury.jpg", radius: 2.0, orbitRadius: 12 },
      { name: "Venus", texture: "images/2k_venus.jpg", radius: 2.8, orbitRadius: 16 },
      { name: "Earth", texture: "images/2k_earth_daymap.jpg", radius: 4.8, orbitRadius: 20 },
      { name: "Mars", texture: "images/2k_mars.jpg", radius: 4.0, orbitRadius: 24 },
      { name: "Jupiter", texture: "images/2k_jupiter.jpg", radius: 9.0, orbitRadius: 0 },
      { name: "Saturn", texture: "images/2k_saturn.jpg", radius: 7.2, orbitRadius: 40 },
      { name: "Neptune", texture: "images/2k_neptune.jpg", radius: 6.0, orbitRadius: 48 }
    ];

    const textureLoader = new THREE.TextureLoader();
    const planetMeshes = [];
    const totalPlanets = planets.length;

    // Arrange planets in a circle around the center on the x-y plane
    planets.forEach((planet, index) => {
      const angle = index * (2 * Math.PI / totalPlanets);
      const x = planet.orbitRadius * Math.cos(angle);
      const y = planet.orbitRadius * Math.sin(angle);
      
      // For Jupiter, use a higher segment count for rounder appearance
      const geometry = (planet.name === "Jupiter") ?
          new THREE.SphereGeometry(planet.radius, 64, 64) :
          new THREE.SphereGeometry(planet.radius, 32, 32);
      
      const texture = textureLoader.load(planet.texture);
      const material = new THREE.MeshStandardMaterial({ map: texture });
      const mesh = new THREE.Mesh(geometry, material);
      
      if (planet.name === "Earth") {
        // For Earth, set its position with a slight negative z-offset so it appears in front,
        // then rotate about the x-axis so that it is viewed from above (front face)
        mesh.position.set(x, 16, -1);
        mesh.rotation.x = 0;  // Remove any rotation so Earth is face-on
      } else if (planet.name === "Venus") {
        // For Venus, move it 2 cm (0.02 units) to the left
        mesh.position.set(x + 15.02, y, 0);
      }else if (planet.name === "Mars") {
        mesh.position.set(x - 8.05, y, 0);
      }else if (planet.name === "Jupiter") {
        mesh.position.set(x - 30.00, y - 14, -8);
      } 
      else {
        mesh.position.set(x, y, 0);
      }
      
      scene.add(mesh);
      planetMeshes.push(mesh);
    });

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);
    const pointLight = new THREE.PointLight(0xffffff, 1.2);
    pointLight.position.set(5, 5, 5);
    scene.add(pointLight);

    // Animation loop: rotate each planet on its axis
    function animate() {
      requestAnimationFrame(animate);
      planetMeshes.forEach(mesh => {
        mesh.rotation.y += 0.005;
      });
      renderer.render(scene, camera);
    }
    animate();

    // Handle window resize events
    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }
});
