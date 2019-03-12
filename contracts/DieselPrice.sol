/*
   Diesel Price

   This contract keeps in storage a reference
   to the Diesel Price in EUR
*/


pragma solidity ^0.5.0;

contract DieselPrice {
    
    mapping (bytes32 => uint) private _value;

    event newDieselQuery(bytes32 indexed latitude, bytes32 indexed longitude, bytes32 indexed zoom);
    event newDieselPrice(uint indexed price, bytes32 indexed key);
    
    function updatePrice(bytes32 quadKey, uint value) public{
        //TODO: Restrict this function so that it can only be called by your secure data source. require()
        _value[quadKey] = value;
        emit newDieselPrice(value, quadKey);
        // do something with the EURO Diesel price
    }
    
    function stringToBytes32(string memory source) private pure returns (bytes32 result) {
        bytes memory tempEmptyStringTest = bytes(source);
        if (tempEmptyStringTest.length == 0) {
            return 0x0;
        }

        assembly {
            result := mload(add(source, 32))
        }
    }
    
    function update(string memory latitude, string memory longitude, string memory zoom) public {
        emit newDieselQuery(stringToBytes32(latitude), stringToBytes32(longitude), stringToBytes32(zoom));
    }
    
    function getDieselValueForKey(bytes32 key) public view returns (uint){
        return _value[key];
    }
}


