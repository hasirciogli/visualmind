# Visual Mind

Visual Mind is a tool that helps you create interactive mind maps from a topic you enter, using artificial intelligence.

<p align="center">
  <img src="_images/example1.png?raw=true" alt="Visual Mind Example 1" width="30%"/>
  <img src="_images/example2.png?raw=true" alt="Visual Mind Example 2" width="30%"/>
  <img src="_images/example0.png?raw=true" alt="Visual Mind Example 0" width="30%"/>
</p>

## ✨ Features

- **AI-Powered:** Automatically generates a mind map for the specified topic.
- **Interactive Interface:** Allows dragging nodes and zooming/panning the generated mind map (using `reactflow`).
- **Dark Mode:** Features a sleek, eye-friendly dark theme interface.
- **Custom Nodes:** Nodes display the topic title and AI-generated descriptions (if available). Descriptions appear next to the nodes.

## 🛠️ Tech Stack

- **Frontend:**
  - [Next.js](https://nextjs.org/) (React Framework)
  - [React](https://reactjs.org/)
  - [React Flow](https://reactflow.dev/) (For mind map visualization)
  - [TypeScript](https://www.typescriptlang.org/)
- **Backend (API):**
  - Next.js API Routes
  - [@google/genai](https://github.com/google/generative-ai-js) (For communicating with the Google Gemini API)
- **Styling:**
  - Inline Styles & Global CSS (JSX)

## 🚀 Getting Started

Follow these steps to run the project locally on your machine:

1.  **Clone the Repository:**

    ```bash
    git clone https://github.com/hasirciogli/visualmind.git
    cd visualmind
    ```

2.  **Install Dependencies:**

    ```bash
    npm install
    # or
    # yarn install
    ```

3.  **Environment Variables:**
    Create a file named `.env.local` in the project's root directory. You'll need to add your Google Gemini API key to this file (required for the backend API to work):

    ```env
    GOOGLE_API_KEY=YOUR_GOOGLE_API_KEY
    ```

    You can obtain an API key from [Google AI Studio](https://aistudio.google.com/app/apikey).

4.  **Start the Development Server:**

    ```bash
    npm run dev
    # or
    # yarn dev
    ```

5.  Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📖 Usage

1.  When you open the application, enter the topic you want to create a mind map for in the input field (e.g., "Artificial Intelligence", "Quantum Physics").
2.  Click the "Generate" button.
3.  The AI will generate a mind map related to your topic and display it on the screen.
4.  You can drag the nodes on the map and zoom in/out using the mouse wheel. Additional information boxes will appear next to nodes that include descriptions.

## 🤝 Contributing

Contributions help make the project better. To report a bug or suggest a new feature, please open an "Issue" or submit a "Pull Request".

## 📄 License

This project is licensed under the MIT License. See the `LICENSE` file in the project's GitHub repository for details.
