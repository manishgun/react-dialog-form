import "./App.css"
import { useForm } from "../../react-dialog-form/src/index.tsx"

function App() {
  const { close, open } = useForm(
    {
      name: { label: "Name", required: false, type: "text" },
      number: { label: "Number", required: false, type: "number" }
    },
    {
      title: "Sign In",
      description: "This is sign In form",
      onSubmit: async values => {
        console.log(values)
      }
    }
  )
  return (
    <div style={{ display: "flex", gap: 3 }}>
      <div
        onClick={() => {
          open()
        }}
      >
        open
      </div>
      <div
        onClick={() => {
          close()
        }}
      >
        close
      </div>
    </div>
  )
}

export default App
