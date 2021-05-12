const STEP_STORAGE_KEY = 'shop-step';
const ORDER_STORAGE_KEY = 'shop-id';

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


var currentStep = 1;
const elementsInsideSteps = [{
    step: 1,
    elements: ['button-confirmcart'],
    containerId: 'client-step1'
  },
  {
    step: 2,
    elements: ['form-contact'],
    containerId: 'client-step2'
  },
  {
    step: 3,
    elements: ['paymentSelect', 'button-payment'],
    containerId: 'client-step3'
  },
  {
    step: 4,
    elements: ['button-pay'],
    containerId: 'client-step4'
  },
  {
    step: 5,
    elements: ['button-getmessages'],
    containerId: 'client-step5'
  },
]


window.addEventListener('load', () => {
  console.log('loaded');

  //setInterval(getMessages, 500);
  getWarehouseOrders();

  if (localStorage.getItem(STEP_STORAGE_KEY)) {
    setCurrentStep(localStorage.getItem(STEP_STORAGE_KEY));
  } else {
    setCurrentStep(1);
  }
  updateOrderIdUi()
});

function updateOrderIdUi() {
  document.getElementById('order-id').innerHTML = localStorage.getItem(ORDER_STORAGE_KEY);

}

function resetState() {
  localStorage.clear(ORDER_STORAGE_KEY);
  localStorage.clear(STEP_STORAGE_KEY);
  setCurrentStep(1);
  updateOrderIdUi();

}

function advanceStep() {

  if (currentStep >= 5) {
    return;
  }

  currentStep += 1;
  setCurrentStep(currentStep);

}

function setCurrentStep(step) {

  console.log('setCurrentStep, step = ', step);

  elementsInsideSteps.filter(e => e.step != step).forEach(s => {
    s.elements.forEach(element => element.disabled = true);
    document.getElementById(s.containerId).setAttribute('class', 'step-disabled');

  });

  let x = elementsInsideSteps.find(e => e.step == step)
  x.elements.forEach(element => {
    element.disabled = false;
  });
  document.getElementById(x.containerId).setAttribute('class', 'step-active');

  localStorage.setItem(STEP_STORAGE_KEY, currentStep);

  updateOrderIdUi();

}

function setStep(step, enable) {
  if (enable === true || enable === false) {
    let stepElement = elementsInsideSteps.find(s => s.step == step)
    stepElement.elements.forEach(element => {
      element.disabled = !enable;
    });
    document.getElementById(stepElement.containerId).setAttribute('class', enable ? 'step-active' : 'step-disabled');


  }

}




function onConfirmCartContents() {
  setStep(1, false);
  console.log('onConfirmCartContents');

  fetch(shopResources.confirmCartContents)
    .then((response) => response.json())
    .then((data) => {
      localStorage.setItem(ORDER_STORAGE_KEY, data.id);
      //document.getElementById('current-process-id').innerHTML = data.id;
      console.log('Success');
      console.log(localStorage.getItem(ORDER_STORAGE_KEY));

      advanceStep();

    }).catch((error) => {
      console.error(error);
      setStep(1, true);
    });
}

function onSubmitClientData(e) {
  setStep(2, false);
  console.log('onSubmitClientData');
  e.preventDefault();

  const formData = new FormData(e.target);

  const payload = {
    id: localStorage.getItem(ORDER_STORAGE_KEY),
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

    advanceStep();

  }).catch((error) => {
    console.error(error);
    setStep(2, true);
  });
}

function submitPaymentMethod() {
  setStep(3, false);
  let selectedValue = document.getElementById('paymentSelect').value;

  console.log(selectedValue);

  if (selectedValue === '') {
    return;
  }

  const payload = {
    id: localStorage.getItem(ORDER_STORAGE_KEY),
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

      advanceStep();

    })
    .catch((error) => {
      console.warn('submitPaymentMethod > Error');
      console.warn(error);
      setStep(3, true);
    });
}

function submitPayment() {

  setStep(4, false);

  document.getElementById('payment-state').innerHTML = 'Processing payment ...';

  setTimeout(() => {
    const payload = {
      id: localStorage.getItem(ORDER_STORAGE_KEY),
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
        document.getElementById('payment-state').innerHTML = 'Payment successful';
        advanceStep();

      })
      .catch((error) => {
        console.warn('submitPayment > Error');
        console.warn(error);
        setStep(4, true);
        document.getElementById('payment-state').innerHTML = 'Error processing payment';
      });
  }, 5000);
}

function getMessages(destId) {
  fetch(shopResources.messages)
    .then((response) => response.json())
    .then((json) => {
      let messages = document.getElementById(destId);
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