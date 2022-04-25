'use strict';
const mongoose = require( 'mongoose' );
const Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;

var tokenAddressSchema = Schema( {
  ownerName: String,
  tokenAddress:String,
  createdAt: Date,
} );

module.exports = mongoose.model( 'TokenAddress', tokenAddressSchema );
