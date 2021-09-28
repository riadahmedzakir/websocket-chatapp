(function () {
    var vm = this;
    vm.socket = io();

    vm.$messageForm = document.querySelector('#message-form');
    vm.$messageFromInput = vm.$messageForm.querySelector('input');
    vm.$messageFormButton = vm.$messageForm.querySelector('input');
    vm.$shareLocationButton = document.getElementById('share-location');
    vm.$messages = document.getElementById('messages');
    vm.$sidebar = document.getElementById('sidebar');

    vm.$messageTemplate = document.getElementById('message-template').innerHTML;
    vm.$locationTemplate = document.getElementById('location-template').innerHTML;
    vm.$sidebarTemplate = document.getElementById('sidebar-template').innerHTML;

    const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true });

    const autoscroll = () => {
        const $newMessage = $messages.lastElementChild;
        const newMessageStyles = getComputedStyle($newMessage);
        const newMessageMargin = parseInt(newMessageStyles.marginBottom);
        const newMessageHeight = $newMessage.offsetHeight + newMessageMargin;
        const visibleHeight = $messages.offsetHeight;
        const containerHeight = $messages.scrollHeight;
        const scrollOffset = $messages.scrollTop + visibleHeight;

        if (containerHeight - newMessageHeight <= scrollOffset) {
            this.$messages.scrollTop = $messages.scrollHeight;
        }
    }

    vm.socket.emit('join', { username, room }, (error) => {
        if (error) {
            alert(error);
            location.href = '/'
        }
    });

    vm.socket.on('message', (response) => {

        const html = Mustache.render(vm.$messageTemplate, {
            username: response.username,
            message: response.text,
            createdAt: moment(response.createdAt).format('h:mm a')
        });

        this.$messages.insertAdjacentHTML('beforeend', html);
        autoscroll();
    });

    vm.socket.on('locationMessage', (response) => {
        const html = Mustache.render(vm.$locationTemplate, {
            username: response.username,
            url: response.text,
            createdAt: moment(response.createdAt).format('h:mm a')
        });

        this.$messages.insertAdjacentHTML('beforeend', html);
        autoscroll();
    });

    vm.socket.on('roomData', ({ room, users }) => {
        const html = Mustache.render(vm.$sidebarTemplate, {
            room: room,
            users: users
        });

        vm.$sidebar.innerHTML = html
    })


    vm.$messageForm.addEventListener('submit', (e) => {
        e.preventDefault();

        vm.$messageFormButton.setAttribute('disabled', 'disabled');

        const message = e.target.elements.message.value;

        this.socket.emit('sendMessage', message, (confirmmationMessage) => {
            vm.$messageFormButton.removeAttribute('disabled');
            vm.$messageFromInput.value = "";
            vm.$messageFromInput.focus();
        });
    });

    vm.$shareLocationButton.addEventListener('click', () => {
        if (!navigator.geolocation) {
            return alert('Geolocation is not supported by your browser');
        }

        vm.$shareLocationButton.setAttribute('disabled', 'disabled');

        navigator.geolocation.getCurrentPosition((position) => {
            this.socket.emit('sendLocation', {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude
            }, () => {
                vm.$shareLocationButton.removeAttribute('disabled');
            });
        });
    });
})()