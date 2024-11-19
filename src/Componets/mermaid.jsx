const handleCalculate = async () => {

  setIsLoading(true);
  // convert to canvas 

  if (!excalidrawAPI) {
    return
  }
  const elements = excalidrawAPI.getSceneElements();
  if (!elements || !elements.length) {
    return
  }
  const canvas = await exportToCanvas({
    elements,
    appState: {
      ...excalidrawAPI.getAppState(),
      exportWithDarkMode: true,
    },
    files: excalidrawAPI.getFiles(),
    getDimensions: () => { return {width: window.innerWidth, height: innerHeight}}
  });
  const ctx = canvas.getContext("2d");
  ctx.font = "30px Virgil";

  try {
    // Send the prompt to the backend
    const response = await fetch(`${backendURL}/calculate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        image:canvas.toDataURL('image/png'),
        dict_of_vars:dictOfVars
      }),
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.statusText}`);
    }

    const resp = await response.json();
    console.log('Backend Response:', resp);

    if (resp) {
      console.log('Responnse: ',resp);
      resp.data.forEach((data) => {
        if (data.assign === true) {
            // dict_of_vars[resp.result] = resp.answer;
            setDictOfVars({
                ...dictOfVars,
                [data.expr]: data.result
            });
        }
    });
      const {result,expr}=resp.data[0];
      const curElements = excalidrawAPI.getSceneElements();
      const xPos = curElements[curElements.length-1].x
      const xWidth = curElements[curElements.length-1].width
      const yPos = curElements[curElements.length-1].y
      const yHeight = curElements[curElements.length-1].height
      const elements=convertToExcalidrawElements([
        {
          type: "text",
          x: xPos+xWidth,
          y: yPos+yHeight,
          width: 1000,
          height: 300,
          text: `Expression : ${expr}`,
          fontSize: 20,
          strokeColor:"#008000"
        },
        {
          type: "text",
          x: xPos+xWidth,
          y: yPos+40+yHeight,
          width: 500,
          height: 300,
          text: `Answer : ${result}`,
          fontSize: 20,
          strokeColor:"#008000"
        }
      ]);
      updateElements(elements)
    }
  } catch (error) {
    console.error("Error fetching data from backend:", error);
  } finally {
    setIsLoading(false);
    setPrompt(''); // Clear the prompt input
  }
};

const updateElements=(elements)=>{
  const previousElements = excalidrawAPI.getSceneElements();
  const sceneData = {
    elements:previousElements.concat(elements),
  };
  excalidrawAPI.updateScene(sceneData);
  excalidrawAPI.scrollToContent(elements,
    {
      fitToViewport:true,
      animate:true,
    }
  )
}

const updateScene = async (diagramDefinition) => {
  
  const { elements, files } = await parseMermaidToExcalidraw(diagramDefinition);
  
  const updatedElements = convertToExcalidrawElements(elements);
  // console.log(files)
  updateElements(updatedElements);
  if (files) {
    excalidrawAPI.addFiles(Object.values(files));
  }
  
  excalidrawAPI.addFiles(files)
};