const Product = require('../models/product');
const Order = require('../models/order');
const User = require("../models/user");
const nodemailer = require("nodemailer");
const sendgridTransport = require('nodemailer-sendgrid-transport');

const transport = nodemailer.createTransport(sendgridTransport({
  auth:{
    api_key: "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"
  }
}))

exports.getProducts = (req, res, next) => {
  Product.find()
    .then(products => {
      console.log(products);
      res.render('shop/product-list', {
        prods: products,
        pageTitle: 'All Products',
        path: '/products'
      });
    })
    .catch(err => {
      console.log(err);
    });
};

exports.getProduct = (req, res, next) => {
  const prodId = req.params.productId;
  Product.findById(prodId)
    .then(product => {
      User.findOne({_id: product.userId})
      .then(user => {
        res.render('shop/product-detail', {
          product: product,
          pageTitle: product.title,
          userInfo: user.email,
          path: '/products'
        });
      })
      
    })
    .catch(err => console.log(err));
};

exports.getIndex = (req, res, next) => {
  Product.find()
    .then(products => {
      res.render('shop/index', {
        prods: products,
        pageTitle: 'Shop',
        path: '/'
      });
    })
    .catch(err => {
      console.log(err);
    });
};

exports.getCart = (req, res, next) => {
  req.user
    .populate('cart.items.productId')
    .execPopulate()
    .then(user => {
      const products = user.cart.items;
      res.render('shop/cart', {
        path: '/cart',
        pageTitle: 'Your Cart',
        products: products
      });
    })
    .catch(err => console.log(err));
};

exports.postCart = (req, res, next) => {
  const prodId = req.body.productId;
  Product.findById(prodId)
    .then(product => {
      return req.user.addToCart(product);
    })
    .then(result => {
      console.log(result);
      res.redirect('/cart');
    });
};

exports.postCartDeleteProduct = (req, res, next) => {
  const prodId = req.body.productId;
  req.user
    .removeFromCart(prodId)
    .then(result => {
      res.redirect('/cart');
    })
    .catch(err => console.log(err));
};

exports.postOrder = (req, res, next) => {
  req.user
    .populate('cart.items.productId')
    .execPopulate()
    .then(user => {
      const products = user.cart.items.map(i => {
        return { quantity: i.quantity, product: { ...i.productId._doc } };
      });
      const order = new Order({
        user: {
          email: req.user.email,
          userId: req.user
        },
        products: products
      });
      return order.save();
    })
    .then(result => {
      return req.user.clearCart();
    })
    .then(() => {
      res.redirect('/orders');
    })
    .catch(err => console.log(err));
};

exports.getOrders = (req, res, next) => {
  Order.find({ 'user.userId': req.user._id })
    .then(orders => {
      res.render('shop/orders', {
        path: '/orders',
        pageTitle: 'Your Orders',
        orders: orders
      });
    })
    .catch(err => console.log(err));
};


exports.postCheckout = (req,res,next) => {
  const order = [];
  Order.find()
  .then(orders => {
    order.push(...orders[0].products)
    return transport.sendMail({
      to: "dominykasbubnys@gmail.com",
      from: "ecomforce4business@gmail.com",
      subject: "Your order information!",
      html: `<h1>
        Data from your orders: 
        <br><hr><br>
        ${JSON.stringify(order[0])}
      </h1>`
    })
  })
  .then(result => Order.findOneAndRemove())
  .then()
  .catch(err => console.log("something goes wrong with orders! ", err));

  res.render('shop/checkout', {
    path: '/checkout',
    pageTitle: 'checkout',
  });

}