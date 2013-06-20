#!/usr/bin/perl
use strict;
use warnings;
use Test::More;

use_ok 'RF::Bits', 'RF::Bits loaded';
use_ok 'RF::Decoder::X10', 'RF::Decoder::X10 loaded';

my $x10 = RF::Decoder::X10->new;
ok $x10, 'created object';

my $res;
my $cb = sub { $res = $_[0] };
$x10->process_bits(bits([0x64,0x9b,0x20,0xdf]), $cb);
is_deeply $res, { house => 'a', unit => 9, command => 'off' },
  '... got good decode';

undef $res;
$x10->process_bits(bits([0x64,0x9b,0x20,0xdf,0xff]), $cb);
is_deeply $res, undef, '... invalid too long for x10';

$x10->process_bits(bits([0x64,0x9c,0x20,0xdf]), $cb);
is_deeply $res, undef, '... invalid not x10 1st pair';

$x10->process_bits(bits([0x64,0x9b,0x20,0xde]), $cb);
is_deeply $res, undef, '... invalid not x10 2nd pair';

done_testing;

sub test_warn {
  my ($code) = @_;
  my $warn = '';
  $SIG{__WARN__} = sub { $warn .= join ' ', @_; };
  $code->();
  delete $SIG{__WARN__};
  $warn;
}

sub bits {
  my ($bytes, $len) = @_;
  $len //= 8*@$bytes;
  RF::Bits->new(_bytes => $bytes, _len => $len);
}
