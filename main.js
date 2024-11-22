require.config({ paths: { vs: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.34.0/min/vs' } });
require(['vs/editor/editor.main'], function () {
    // 创建编辑器
    const editor = monaco.editor.create(document.getElementById('container'), {
        value: '',
        language: 'jql',
        theme: 'vs-dark',
        minimap: { enabled: false },
    });

    // 注册语言并定义 JQL 的简单规则
    monaco.languages.register({ id: 'jql' });

    monaco.languages.setMonarchTokensProvider('jql', {
        tokenizer: {
            root: [
                [/\b(AND|OR|NOT|IN|IS|EMPTY|NULL|ORDER BY|ASC|DESC|WAS|CHANGED|AFTER|BEFORE)\b/, 'keyword'],
                [/\b(project|issue|status|assignee|priority|resolution|labels|created|updated|duedate|summary)\b/, 'field'],
                [/[=><!~]+/, 'operator'],
                [/".*?"/, 'string'],
                [/\d+/, 'number'],
            ],
        },
    });

    // 自动补全支持
    monaco.languages.registerCompletionItemProvider('jql', {
        provideCompletionItems: (model, position) => {
            const suggestions = [];

            const textUntilPosition = model.getValueInRange({
                startLineNumber: 1,
                startColumn: 1,
                endLineNumber: position.lineNumber,
                endColumn: position.column,
            });

            const keywords = [
                'AND', 'OR', 'NOT', 'IN', 'IS', 'EMPTY', 'NULL',
                'ORDER BY', 'ASC', 'DESC', 'WAS', 'CHANGED', 'AFTER', 'BEFORE',
            ];

            const fields = [
                'project', 'issue', 'status', 'assignee', 'priority', 'resolution',
                'labels', 'created', 'updated', 'duedate', 'summary',
            ];

            const operators = ['=', '!=', '>', '<', '>=', '<=', '~', 'IN'];

            const valuesForField = {
                status: ['Open', 'In Progress', 'Done'],
                priority: ['High', 'Medium', 'Low'],
            };

            if (textUntilPosition.match(/\bORDER BY\s*$/)) {
                suggestions.push(
                    ...fields.map((field) => ({
                        label: field,
                        kind: monaco.languages.CompletionItemKind.Field,
                        insertText: field,
                    })),
                    ...[
                        { label: 'ASC', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'ASC' },
                        { label: 'DESC', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'DESC' },
                    ]
                );
            } else if (textUntilPosition.match(/\b(status|priority|resolution)\s*$/)) {
                const fieldMatch = textUntilPosition.match(/\b(status|priority|resolution)\s*$/);
                if (fieldMatch) {
                    const field = fieldMatch[1];
                    const values = valuesForField[field] || [];
                    suggestions.push(
                        ...values.map((value) => ({
                            label: value,
                            kind: monaco.languages.CompletionItemKind.Value,
                            insertText: `"${value}"`,
                        }))
                    );
                }
            } else if (textUntilPosition.match(/\b(project|issue|status|assignee|priority)\s*$/)) {
                suggestions.push(
                    ...operators.map((op) => ({
                        label: op,
                        kind: monaco.languages.CompletionItemKind.Operator,
                        insertText: op,
                    }))
                );
            } else {
                suggestions.push(
                    ...keywords.map((keyword) => ({
                        label: keyword,
                        kind: monaco.languages.CompletionItemKind.Keyword,
                        insertText: keyword,
                    })),
                    ...fields.map((field) => ({
                        label: field,
                        kind: monaco.languages.CompletionItemKind.Field,
                        insertText: field,
                    }))
                );
            }

            return { suggestions };
        },
    });

    function validateJQL(query) {
        const errors = [];

        // 正则表达式检查是否包含 project 字段
        if (!query.match(/\bproject\s*=\s*("[^"]+"|[^\s]+)/)) {
            errors.push("Missing or invalid 'project' field.");
        }

        // 检查 ORDER BY 是否正确
        if (query.match(/\bORDER\s*BY\b/) && !query.match(/\bORDER\s*BY\b.*\b(ASC|DESC)\b/)) {
            errors.push("Invalid 'ORDER BY' syntax. Expected 'ASC' or 'DESC'.");
        }

        // 检查是否有有效的关键字
        const validKeywords = [
            'AND', 'OR', 'NOT', 'IN', 'IS', 'EMPTY', 'NULL',
            'ORDER', 'BY', 'ASC', 'DESC', 'WAS', 'CHANGED', 'AFTER', 'BEFORE'
        ];

        // 正则匹配所有大写字母的单词，并过滤掉已知的有效关键字
        const invalidKeywords = query.match(/\b[A-Z_]{2,}\b/g)?.filter((kw) => !validKeywords.includes(kw));

        if (invalidKeywords?.length) {
            errors.push(`Unknown keywords: ${invalidKeywords.join(', ')}`);
        }

        return errors;
    }

    // 绑定校验按钮
    document.getElementById('validateBtn').addEventListener('click', () => {
        const query = editor.getValue();
        const errors = validateJQL(query);
        const outputElement = document.getElementById('output');
        if (errors.length === 0) {
            outputElement.textContent = "Syntax is valid!";
            outputElement.style.color = "green";
        } else {
            outputElement.textContent = `Syntax Errors:\n- ${errors.join('\n- ')}`;
            outputElement.style.color = "red";
        }
    });

    // 绑定提交按钮
    document.getElementById('submitBtn').addEventListener('click', () => {
        const query = editor.getValue();
        const outputElement = document.getElementById('output');
        outputElement.textContent = `Submitted Query:\n${query}`;
        outputElement.style.color = "blue";

        // 模拟提交功能
        // fetch('/api/submit', {
        //     method: 'POST',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify({ query }),
        // }).then((response) => {
        //     if (response.ok) {
        //         outputElement.textContent = "Query submitted successfully!";
        //     } else {
        //         outputElement.textContent = "Failed to submit query.";
        //     }
        // });
    });
});

