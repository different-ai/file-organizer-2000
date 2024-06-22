import * as React from "react";
import { useEffect, useState } from "react";
import FileOrganizer from "./index";
import { configureTaskV2 } from "./models";
import { logMessage } from "../utils";
import { resetModels } from "./models";

interface ModelForXTabProps {
  plugin: FileOrganizer;
}

const Setting: React.FC<{
  name: string;
  description?: string;
  children?: React.ReactNode;
}> = ({ name, description, children }) => {
  return (
    <div style={styles.setting}>
      <h6 style={styles.settingTitle}>{name}</h6>
      {description && (
        <div style={styles.settingDescription}>{description}</div>
      )}
      <div style={styles.settingChildren}>{children}</div>
    </div>
  );
};

const ModelsReact: React.FC<ModelForXTabProps> = ({ plugin }) => {
  const [apiKey, setApiKey] = useState("");
  const [modelName, setModelName] = useState("gpt-4o");
  const [url, setUrl] = useState("https://api.openai.com/v1");
  const [models, setModels] = useState(plugin.settings.userModels || {});
  const [textModel, setTextModel] = useState(plugin.settings.textModel);
  const [visionModel, setVisionModel] = useState(plugin.settings.visionModel);
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    const reloadTasks = async () => {
      logMessage(`Reloading tasks for models: ${textModel}, ${visionModel}`);
      await saveTasks();
    };

    reloadTasks();
  }, [textModel, visionModel]);

  const saveTasks = async () => {
    logMessage(`Saving model ${modelName} with OpenAI`);
    plugin.settings.textModel = textModel;
    plugin.settings.visionModel = visionModel;
    logMessage("Saving model", plugin.settings.textModel);
    logMessage("Saving model", plugin.settings.visionModel);
    configureTaskV2({
      task: "text",
      provider: "openai",
      apiKey,
      modelName,
    });
    configureTaskV2({
      task: "vision",
      provider: "openai",
      apiKey,
      modelName: visionModel,
    });

    await plugin.saveSettings();
  };

  const addModel = async () => {
    logMessage(`Adding model ${modelName} `);
    console.log(apiKey);
    console.log(url);
    setModels({
      ...models,
      [modelName]: { url, apiKey, provider: "openai" },
    });
    plugin.settings.userModels = {
      ...models,
      [modelName]: { url, apiKey, provider: "openai" },
    };
    setModelName("");
    setApiKey("");
    setUrl("");
    await saveTasks();
    await plugin.saveSettings();
  };

  const updateTextModel = async (model: string) => {
    setTextModel(model);
    plugin.settings.textModel = model;
    await plugin.saveSettings();
  };

  const updateVisionModel = async (model: string) => {
    setVisionModel(model);
    plugin.settings.visionModel = model;
    await plugin.saveSettings();
  };
  const reset = async () => {
    setModels({});
    resetModels();
    plugin.settings.userModels = {};
    await plugin.saveSettings();
  };

  return (
    <div style={styles.modelsReact}>
      {/* Model Provider and Settings Section */}
      <div style={styles.modelProviderAndSettings}>
        <Setting
          name="API Key"
          description="Add your OpenAI key here or any other OpenAI compatible api"
        >
          <input
            style={styles.settingInput}
            type="text"
            placeholder="Enter your API Key"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
          />
        </Setting>
        <div style={styles.advancedToggle}>
          <button onClick={() => setShowAdvanced(!showAdvanced)}>
            {showAdvanced ? "Hide Advanced Settings" : "Show Advanced Settings"}
          </button>
        </div>
        {showAdvanced && (
          <>
            <Setting name="Model Name">
              <input
                style={styles.settingInput}
                type="text"
                placeholder="Enter the model name"
                value={modelName}
                onChange={(e) => setModelName(e.target.value)}
              />
            </Setting>
            <Setting name="URL" description="Enter the model URL">
              <input
                style={styles.settingInput}
                type="text"
                placeholder="Enter the model URL"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
            </Setting>
          </>
        )}
      </div>

      {/* Add Model Section */}
      <div>
        <div style={styles.addButtonContainer}>
          <button className="mod-cta" onClick={addModel}>
            Add AI model
          </button>
        </div>
      </div>
      {Object.keys(models).length > 0 && (
        <div>
          {/* Text Model Selection */}
          <div style={styles.modelSelection}>
            <Setting name="Text Model" description="Select your text model">
              <select
                style={styles.settingInput}
                value={textModel}
                onChange={(e) => updateTextModel(e.target.value)}
              >
                {Object.keys(models).map((model, index) => (
                  <option key={index} value={model}>
                    {model}
                  </option>
                ))}
              </select>
              {/*  display model info */}
              {models[textModel] && (
                <div className="setting-item">
                  <div className="setting-item-info">
                    <span className="small-text">Provider: </span>
                    <span className="small-text" style={{ color: "#666" }}>
                      {models[textModel].provider}
                    </span>
                  </div>
                  <div className="setting-item-info">
                    <span className="small-text">API Key: </span>
                    <span className="small-text" style={{ color: "#666" }}>
                      {models[textModel].apiKey}
                    </span>
                  </div>
                  <div className="setting-item-info">
                    <span className="small-text">URL: </span>
                    <span className="small-text" style={{ color: "#666" }}>
                      {models[textModel].url}
                    </span>
                  </div>
                </div>
              )}
            </Setting>
          </div>

          {/* Vision Model Selection */}
          <div style={styles.modelSelection}>
            <Setting name="Vision Model" description="Select your vision model">
              <select
                style={styles.settingInput}
                value={visionModel}
                onChange={(e) => updateVisionModel(e.target.value)}
              >
                {Object.keys(models).map((model, index) => (
                  <option key={index} value={model}>
                    {model}
                  </option>
                ))}
              </select>
            </Setting>
          </div>

          {/* Save Models Button */}
          <div style={styles.saveButtonContainer}>
            {/* reset model settings */}
            <button className="mod" onClick={reset}>
              Reset models
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
const styles = {
  advancedToggle: {
    marginBottom: "20px",
  },
  modelsReact: {
    fontFamily: "Arial, sans-serif",
  },
  sectionTitle: {
    fontSize: "16px",
    fontWeight: "bold",
    marginBottom: "10px",
  },
  setting: {
    marginBottom: "20px",
  },
  settingTitle: {
    fontSize: "14px",
    fontWeight: "bold",
    marginBottom: "5px",
  },
  settingDescription: {
    fontSize: "12px",
    color: "#666",
    marginBottom: "10px",
  },
  settingChildren: {
    marginTop: "10px",
  },
  settingInput: {
    width: "100%",
    fontSize: "14px",
    border: "1px solid #ccc",
    borderRadius: "4px",
  },
  separationBar: {
    height: "1px",
    backgroundColor: "#ccc",
    margin: "20px 0",
  },
  modelProviderAndSettings: {},
  addButtonContainer: {
    marginTop: "10px",
  },
  addButton: {
    padding: "10px 20px",
    fontSize: "14px",
    fontWeight: "bold",
    color: "#fff",
    backgroundColor: "#007bff",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
  },
  modelsList: {
    marginTop: "20px",
  },
  saveButtonContainer: {
    marginTop: "20px",
    display: "flex",
    gap: "10px",
  },
  saveButton: {
    padding: "10px 20px",
    fontSize: "14px",
    fontWeight: "bold",
    color: "#fff",
    backgroundColor: "#007bff",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
  },
  modelSelection: {
    marginTop: "20px",
  },
};

export default ModelsReact;
