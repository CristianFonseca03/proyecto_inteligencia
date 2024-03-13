import { createRef, useCallback, useContext, useEffect, useState } from "react";
import Markdown from "react-markdown";
import CodeBlock from "./CodeBlock.tsx";
import "bootstrap-icons/font/bootstrap-icons.css";
import ContextMenu from "./ContextMenu.tsx";
import "./style.css";
import TextArea from "./TextArea.tsx";
import { SettingsContext } from "./SettingsContext.tsx";
import useCompletion from "./useCompletion.ts";
import useClickOutside from "./useClickOutside.ts";

export type MessageData = { content: string; author: string };

const Assistant = () => {
  const [value, setValue] = useState<string>("");
  const [value2, setValue2] = useState<string>("");
  const [mythology, setMythology] = useState("Mitología Griega");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [abortController, setAbortController] =
    useState<AbortController | null>(null);
  const [messages, setMessages] = useState<MessageData[]>([]);
  const [contextMenuMessage, setContextMenuMessage] =
    useState<MessageData | null>(null);
  const ref = createRef<HTMLTextAreaElement>();
  const ref2 = createRef<HTMLTextAreaElement>();
  const clickOutsideRef = createRef<HTMLDivElement>();
  useClickOutside(clickOutsideRef, () => {
    setContextMenuMessage(null);
  });
  const {
    systemPrompt,
    chatbotName,
    userName,
    promptTemplate,
    chatHistoryTemplate,
    llamaEndpoint,
    stop,
  } = useContext(SettingsContext);
  const { complete } = useCompletion();

  const handleSubmit = async (
    value: string,
    value2: string,
    mitology: string,
  ) => {
    const newMessages: MessageData[] = [
      ...messages,
      {
        content: "Generando un mito con las características solicitadas:",
        author: userName,
      },
    ];
    setMessages(newMessages);

    setIsLoading(true);

    const history = newMessages
      .map(({ content, author }) =>
        chatHistoryTemplate
          .replace("{{name}}", author)
          .replace("{{message}}", content),
      )
      .join("\n");

    const controller = new AbortController();
    setAbortController(controller);

    await complete(
      value,
      value2,
      mitology,
      llamaEndpoint,
      systemPrompt,
      chatbotName,
      promptTemplate,
      stop,
      controller.signal,
      history,
      (content: string) => {
        setMessages([...newMessages, { content, author: chatbotName }]);
      },
    );

    setIsLoading(false);
  };

  const getFocus = useCallback(
    (event: KeyboardEvent) => {
      if (event.target === document.body) {
        ref.current?.focus();
      }
    },
    [ref],
  );

  useEffect(() => {
    document.addEventListener("keypress", getFocus);

    return () => {
      document.removeEventListener("keypress", getFocus);
    };
  }, [getFocus]);

  return (
    <div className="flex-col overflow-hidden">
      <div className="flex-col-reverse grow p-1 overflow-auto position-relative">
        {[...messages].reverse().map((message, index) => {
          const { content, author } = message;

          return (
            <div
              className={`rounded-3 bg-gray-200 p-3 ${
                author === userName
                  ? "rounded-bottom-right-0 m-left-2"
                  : "rounded-bottom-left-0 m-right-2"
              }`}
              onContextMenu={(event) => {
                event.preventDefault();
                setContextMenuMessage(message);
              }}
              key={index}
            >
              <Markdown components={{ code: CodeBlock }}>{content}</Markdown>
            </div>
          );
        })}

        {contextMenuMessage && (
          <ContextMenu
            contextRef={clickOutsideRef}
            message={contextMenuMessage}
            close={() => {
              setContextMenuMessage(null);
            }}
          />
        )}
      </div>

      <div className="flex-col gap-2 p-1">
        <div className="flex">
          <button
            onClick={() => {
              setMessages([]);
            }}
            className="danger"
          >
            Limpiar
          </button>

          {isLoading && abortController !== null && (
            <button
              onClick={() => {
                abortController.abort();
              }}
              className="danger"
            >
              Parar
            </button>
          )}
        </div>

        <form
          className="flex"
          onSubmit={async (event) => {
            event.preventDefault();

            if (!isLoading) {
              await handleSubmit(value, value2, mythology);
            }
          }}
        >
          <select
            name="mythology"
            id="mythology"
            value={mythology}
            onChange={(e) => setMythology(e.target.value)}
          >
            <option value="Mitología Griega">Mitología Griega</option>
            <option value="Mitología Nórdica">Mitología Nórdica</option>
            <option value="Mitología Egipcia">Mitología Egipcia</option>
            <option value="Mitología Muizca">Mitología Muizca</option>
            <option value="Mitología Maya">Mitología Maya</option>
          </select>
          <TextArea
            className="w-100"
            onInput={({ currentTarget }) => {
              setValue(currentTarget.value);
            }}
            textAreaRef={ref}
            value={value}
            autoComplete="off"
            name="question"
          />
          <TextArea
            className="w-100"
            onInput={({ currentTarget }) => {
              setValue2(currentTarget.value);
            }}
            textAreaRef={ref2}
            value={value2}
            autoComplete="off"
            name="question"
          />

          <button className="primary flex align-center" disabled={isLoading}>
            Crear
          </button>
        </form>
      </div>
    </div>
  );
};

export default Assistant;
