new Vue({
    el: '#chat-app',
    data: {
        userInput: '',
        messages: [
            { text: 'Hello! How can I assist you today?', sender: 'bot' },
        ],
        openMapKeywords: ["where", "location", "capital of"]
    },
    methods: {
        async sendMessage() {
            if (this.userInput.trim() !== '') {
                this.messages.push({ text: this.userInput, sender: 'user' });
                this.userInput = '';
                await this.botReply();
                this.$nextTick(() => {
                    this.scrollToBottomSmooth();
                });
            }
        },
        async botReply() {
            const query = this.messages[this.messages.length - 1].text;

            if (this.isLocationQuery(query)) {
                await this.searchOpenStreetMap(query);
            } else if (this.isJokeQuery(query)) {
                await this.fetchJoke();
            } else if (this.isInterestingFactQuery(query)) {
                await this.fetchInterestingFact();
            } else if (this.isMotivationQuery(query)) {
                await this.fetchMotivationalQuote();
            } else {
                await this.searchDuckDuckGo(query);
            }
        },
        isLocationQuery(query) {
            return this.openMapKeywords.some(keyword => query.toLowerCase().includes(keyword));
        },
        isJokeQuery(query) {
            return /joke/i.test(query);
        },
        isInterestingFactQuery(query) {
            return /interesting fact/i.test(query);
        },
        isMotivationQuery(query) {
            return /motivation|quote/i.test(query);
        },
        async searchOpenStreetMap(query) {
            const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1`;

            try {
                const response = await fetch(url);
                const data = await response.json();
                if (data.length > 0) {
                    const result = data[0];
                    const locationInfo = `${result.display_name}.`;
                    this.pushLongText(locationInfo);
                } else {
                    await this.searchDuckDuckGo(query);
                }
            } catch (error) {
                console.error('Error:', error);
                await this.searchDuckDuckGo(query);
            }
        },
        async searchDuckDuckGo(query) {
            const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&pretty=1`;

            try {
                const response = await fetch(url);
                const data = await response.json();
                const result = data.AbstractText;

                if (result) {
                    this.pushLongText(result);
                } else {
                    await this.searchBing(query);
                }
            } catch (error) {
                console.error('Error:', error);
                await this.searchBing(query);
            }
        },
        async searchBing(query) {
            const url = `https://api.bing.com/osjson.aspx?query=${encodeURIComponent(query)}`;

            try {
                const response = await fetch(url);
                const data = await response.json();
                const result = data[1] ? data[1][0] : null;

                if (result) {
                    this.pushLongText(result);
                } else {
                    await this.searchWikipedia(query);
                }
            } catch (error) {
                console.error('Error:', error);
                await this.searchWikipedia(query);
            }
        },
        async searchWikipedia(query) {
            const url = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&origin=*`;

            try {
                const response = await fetch(url);
                const data = await response.json();
                const searchResults = data.query.search;

                if (searchResults.length > 0) {
                    const firstResult = searchResults[0].snippet.replace(/<\/?[^>]+(>|$)/g, "").replace(/&quot;/g, '"');
                    this.pushLongText(firstResult);
                } else {
                    this.messages.push({
                        text: "I'm sorry, I couldn't find an answer to that.",
                        sender: 'bot'
                    });
                }
            } catch (error) {
                console.error('Error:', error);
                this.messages.push({
                    text: "There was an error processing your request. Please try again later.",
                    sender: 'bot'
                });
            }
        },
        async fetchJoke() {
            const url = 'https://v2.jokeapi.dev/joke/Any?type=single';

            try {
                const response = await fetch(url);
                const data = await response.json();
                if (data.joke) {
                    this.messages.push({
                        text: data.joke,
                        sender: 'bot'
                    });
                } else {
                    this.messages.push({
                        text: "I couldn't find a joke right now.",
                        sender: 'bot'
                    });
                }
            } catch (error) {
                console.error('Error:', error);
                this.messages.push({
                    text: "There was an error fetching the joke.",
                    sender: 'bot'
                });
            }
        },
        async fetchInterestingFact() {
            const url = 'https://uselessfacts.jsph.pl/random.json?language=en';

            try {
                const response = await fetch(url);
                const data = await response.json();
                this.messages.push({
                    text: data.text,
                    sender: 'bot'
                });
            } catch (error) {
                console.error('Error:', error);
                this.messages.push({
                    text: "There was an error fetching an interesting fact.",
                    sender: 'bot'
                });
            }
        },
        async fetchMotivationalQuote() {
            const url = 'https://api.quotable.io/random?tags=inspirational';

            try {
                const response = await fetch(url);
                const data = await response.json();
                this.messages.push({
                    text: `"${data.content}" — ${data.author}`,
                    sender: 'bot'
                });
            } catch (error) {
                console.error('Error:', error);
                this.messages.push({
                    text: "There was an error fetching a motivational quote.",
                    sender: 'bot'
                });
            }
        },
        pushLongText(text) {
            const chunkSize = 2000; // Define the chunk size
            for (let i = 0; i < text.length; i += chunkSize) {
                const chunk = text.substring(i, i + chunkSize);
                this.messages.push({
                    text: chunk,
                    sender: 'bot'
                });
            }
        },
        scrollToBottomSmooth() {
            const chatMessages = this.$el.querySelector('.chat-messages');
            chatMessages.scrollTo({
                top: chatMessages.scrollHeight,
                behavior: 'smooth'
            });
        }
    }
});
