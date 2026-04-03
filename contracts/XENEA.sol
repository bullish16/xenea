// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract XENEA is ERC20 {
    constructor() ERC20("XENEA", "XENEA") {
        _mint(msg.sender, 1_000_000_000 * 10 ** decimals());
    }
}
