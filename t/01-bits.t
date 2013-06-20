#!/usr/bin/perl
use strict;
use warnings;
use Test::More;

use_ok 'RF::Bits', 'RF::Bits loaded';

my $b = RF::Bits->new;
ok $b, 'created object';
$b->add_bit(1);
is $b->length, 1, '... length in bits';
is $b->byte_length, 1, '... length in bytes';
is $b->byte(), 0x80, '... byte value';
is $b->pretty, '80', '... pretty print';
is $b->pretty_binary, '10000000', '... pretty binary';
$b->add_bit(0);
$b->add_bit(1);
is $b->length, 3, '... length in bits';
is $b->byte_length, 1, '... length in bytes';
is $b->byte(0), 0xa0, '... byte[0] value';
is $b->pretty, 'a0', '... pretty print';
is $b->pretty_binary, '10100000', '... pretty binary';
$b->add_bit(0);
$b->add_bit(1);
$b->add_bit(0);
$b->add_bit(1);
$b->add_bit(0);
$b->add_bit(1);
is $b->length, 9, '... length in bits';
is $b->byte_length, 2, '... length in bytes';
is $b->byte(0), 0xaa, '... byte[0] value';
is $b->byte(1), 0x80, '... byte[1] value';
is $b->pretty, 'aa 80', '... pretty print';
is $b->pretty_binary, '10101010 10000000', '... pretty binary';

# handle empty (all zeroes) bits in the middle (regression test)
$b = RF::Bits->new;
ok $b, 'created object';
$b->add_bit(1);
$b->add_bit(0) for (1..16);
$b->add_bit(1);
is $b->length, 18, '... length in bits';
is $b->byte_length, 3, '... length in bytes';
is $b->byte(0), 0x80, '... byte[0] value';
is $b->byte(1), 0x00, '... byte[1] value';
is $b->byte(2), 0x40, '... byte[2] value';
is $b->pretty, '80 00 40', '... pretty print';
is $b->pretty_binary, '10000000 00000000 01000000', '... pretty binary';

done_testing;
