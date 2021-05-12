window.addEventListener('load', () => {
  console.log('loaded');

  //setInterval(getMessages, 500);
  getWarehouseOrders();
});

const shopUrl = 'http://localhost:80/';

const shopResources = {
  confirmCartContents: shopUrl + 'confirmCartContents',
  submitClientData: shopUrl + 'submitClientData',
  messages: shopUrl + 'messages',
  payment: shopUrl + 'payment',
  paymentProvider: shopUrl + 'payment/provider',

  warehouseOrders: shopUrl + 'warehouse/orders',
  warehouseRealiseOrder: shopUrl + 'warehouse/realiseorder',
};

function onConfirmCartContents() {
  console.log('onConfirmCartContents');

  fetch(shopResources.confirmCartContents)
    .then((response) => response.json())
    .then((data) => {
      localStorage.setItem('id', data.id);
      //document.getElementById('current-process-id').innerHTML = data.id;
      console.log('Success');
      console.log(localStorage.getItem('id'));
    });
}

function onSubmitClientData(e) {
  console.log('onSubmitClientData');
  e.preventDefault();

  const formData = new FormData(e.target);

  const payload = {
    id: localStorage.getItem('id'),
    firstName: formData.get('firstName'),
    lastName: formData.get('lastName'),
  };

  fetch(shopResources.submitClientData, {
    method: 'POST',
    body: JSON.stringify(payload),
    headers: {
      'Content-Type': 'application/json',
    },
  }).then(() => {
    console.log('Success');
    //localStorage.removeItem('id');
  });
}

function submitPaymentMethod() {
  let selectedValue = document.getElementById('paymentSelect').value;

  console.log(selectedValue);

  if (selectedValue === '') {
    return;
  }

  const payload = {
    id: localStorage.getItem('id'),
    paymentMethod: selectedValue,
  };
  console.log('payload');
  console.log(payload);

  fetch(shopResources.payment, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })
    .then(() => {
      console.log('submitPaymentMethod > Success');
    })
    .catch((error) => {
      console.warn('submitPaymentMethod > Error');
      console.warn(error);
    });
}

function submitPayment() {
  setTimeout(() => {
    const payload = {
      id: localStorage.getItem('id'),
      msg: 'Payment succeded!',
    };

    fetch(shopResources.paymentProvider, {
      method: 'POST',
      header: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })
      .then(() => {
        console.log('submitPayment > Success');
      })
      .catch((error) => {
        console.warn('submitPayment > Error');
        console.warn(error);
      });
  }, 5000);
}

function getMessages() {
  fetch(shopResources.messages)
    .then((response) => response.json())
    .then((json) => {
      let messages = document.getElementById('messages');
      messages.innerHTML = '';
      json.messages.forEach((m) => {
        let newMessage = document.createElement('div');
        newMessage.innerHTML = `${new Date(m.when).toISOString()} : "${m.msg}"`;
        messages.appendChild(newMessage);
      });
    })
    .catch((error) => {
      console.warn(error);
    });
}

function setOrderAsRealised(orderId) {
  console.log(`setOrderAsRealised > will set order ${orderId} as realised`);

  let payload = {
    id: orderId,
  };

  fetch(shopResources.warehouseRealiseOrder, {
    method: 'POST',
    body: JSON.stringify(payload),
    headers: {
      'Content-Type': 'application/json',
    },
  })
    .then(() => {
      console.log('setOrderAsRealised > Success');
    })
    .catch((error) => {
      console.warn('setOrderAsRealised > Error');
      console.warn(error);
    })
    .finally(() => {
      getWarehouseOrders();
    });
}

function getWarehouseOrders() {
  fetch(shopResources.warehouseOrders)
    .then((response) => response.json())
    .then((json) => {
      let ordersContainer = document.getElementById('warehouse-orders');
      ordersContainer.innerHTML = '';
      if (json.orders.length == 0) {
        ordersContainer.innerHTML = '(no orders)';
      } else {
        json.orders.forEach((order) => {
          let orderElement = document.createElement('div');
          let html = '';
          html = `id:${order.id}, sent?:${order.sent}`;
          if (!order.sent) {
            html =
              html +
              `<button class="btn" onClick="setOrderAsRealised('${order.id}')">mark as sent</button><br>`;
          }
          orderElement.innerHTML = html;
          ordersContainer.appendChild(orderElement);
        });
      }
    });
}
