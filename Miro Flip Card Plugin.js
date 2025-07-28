/* main.js */

// This function contains the main logic for the plugin and will be called when the Miro SDK is ready.
async function initialize() {
  console.log("Miro SDK is ready and the plugin is initializing.");

  // The 'experimental_items:click' event fires when a user clicks on items on the board.
  // This is the simplest way to detect a "flip" action from the user.
  // Note: This is an experimental feature and its behavior might change in future SDK versions.
  miro.board.ui.on('experimental_items:click', async ({ items }) => {
    // We are only interested when a single item is clicked to avoid ambiguity.
    if (items.length !== 1) {
      return;
    }
    const targetItem = items[0];

    // Check if the clicked item is one of our flip cards by checking its metadata.
    const metadata = await targetItem.getMetadata();
    if (metadata && metadata.appId === 'flip-card-app') {
      let { currentSide, cardData } = metadata;

      // Calculate the index of the next side to show, looping back to the start if necessary.
      currentSide = (currentSide + 1) % cardData.length;
      const nextSide = cardData[currentSide];

      // Update the shape's content with the new text and image from the next side.
      await targetItem.update({
        content: `<img src="${nextSide.imageUrl}" style="max-width:100%; max-height: 70%; display: block; margin: auto;" onerror="this.style.display='none'"><p>${nextSide.text}</p>`,
      });

      // Update the metadata to store the new current side index.
      await targetItem.setMetadata({
        ...metadata,
        currentSide: currentSide,
      });
      await targetItem.sync(); // Ensure changes are saved and visible to other users.
      miro.showNotification('Card flipped!');
    }
  });

  // Get the "Create" button from the sidebar panel.
  const createCardButton = document.getElementById('create-card');
  if (createCardButton) {
    // Add a click listener to the "Create Flip Card" button.
    createCardButton.onclick = async () => {
      // Collect the data from all the input fields in the sidebar.
      const cardData = [];
      for (let i = 1; i <= 4; i++) {
        const textInput = document.getElementById(`card${i}-text`);
        const imageInput = document.getElementById(`card${i}-image`);
        const text = textInput ? textInput.value : '';
        const imageUrl = imageInput ? imageInput.value : '';
        
        // Only add a card side if it has either text or an image URL.
        if (text || imageUrl) {
          cardData.push({ text, imageUrl });
        }
      }

      // If no data was entered, show an error and do nothing.
      if (cardData.length === 0) {
        miro.showErrorNotification('Please define at least one card side.');
        return;
      }

      // Create a new shape on the board to act as our flip card container.
      const initialSide = cardData[0];
      const shape = await miro.board.createShape({
        content: `<img src="${initialSide.imageUrl}" style="max-width:100%; max-height: 70%; display: block; margin: auto;" onerror="this.style.display='none'"><p>${initialSide.text}</p>`,
        shape: 'rectangle',
        style: {
          fillColor: '#ffffff', // White background
          borderColor: '#000000', // Black border
          borderWidth: 2,
        },
        width: 320,
        height: 240,
      });

      // Store the card data and the current side index in the shape's metadata.
      // This allows us to retrieve the data later when the card is clicked.
      await shape.setMetadata({
        appId: 'flip-card-app', // A unique ID to identify our flip cards.
        cardData: cardData,
        currentSide: 0, // Start with the first side.
      });
      await shape.sync();
      
      miro.showNotification('Flip card created! Click the shape on the board to flip it.');
    };
  } else {
    // This error would appear if the button's ID in index.html is changed.
    console.error("The 'create-card' button was not found in the panel.");
  }
}

// The miro.onReady function ensures that our code runs only after the Miro SDK is fully loaded and connected.
// This resolves the 'Miro SDK is not connected' error.
miro.onReady(initialize);
