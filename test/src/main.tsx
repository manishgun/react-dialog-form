import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import "./index.css"
import App from "./App.tsx"
import { FormProvider } from "../../react-dialog-form/src/index.tsx"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <FormProvider>
      <App />
    </FormProvider>
  </StrictMode>
)
