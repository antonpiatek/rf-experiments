use strict;
use warnings;
package RF::Decoder::X10;

use base 'RF::Decoder::Pulse';
use RF::Utils qw/within_error_margin/;
use RF::Bits;

use constant {
  DEBUG => $ENV{RF_DECODER_X10_DEBUG},
};

sub new {
  shift->SUPER::new(gap => 9480, gap_high => 4920, long => 1860, short => 600,
                    low => 600, length => 32, @_);
}

my %byte_to_house =
  (
   '6' => 'a',  '7' => 'b',  '4' => 'c',  '5' => 'd',  '8' => 'e',  '9' => 'f',
   '10' => 'g',  '11' => 'h',  '14' => 'i',  '15' => 'j',  '12' => 'k',
   '13' => 'l',  '0' => 'm',  '1' => 'n',  '2' => 'o',  '3' => 'p',
  );

my %byte_to_unit = 
  (
   0x00 => 1, 0x10 => 2, 0x08 => 3, 0x18 => 4, 0x40 => 5, 0x50 => 6,
   0x48 => 7, 0x58 => 8
  );
my $unit_mask= 0x58;

my %byte_to_command =
  (
   0x0 => 'on',
   0x20 => 'off',
   0x80 => 'all_lights_off',
   0x88 => 'bright',
   0x90 => 'all_lights_on',
   0x98 => 'dim',
  );

sub process_bits {
  my ($self, $bits, $cb) = @_;
  my $bytes = $bits->bytes;
  if (is_x10($bytes)) {
    my %r = ();
    my $mask = 0x98;
    unless ($bytes->[2]&0x80) {
      $r{unit} = $byte_to_unit{$bytes->[2]&$unit_mask};
      $r{unit} += 8 if ($bytes->[0]&0x4);
      $mask = 0x20;
    }
    $r{house} = $byte_to_house{($bytes->[0]&0xf0)>>4};
    $r{command} = $byte_to_command{$bytes->[2]&$mask};
    print STDERR 'X10: ', $r{house}, ' ', $r{unit}||'', ' ', $r{command}, "\n"
      if DEBUG;
    $cb->(\%r);
  }
}

=method C<is_x10( $bytes )>

Takes an array reference of bytes from an RF message and returns true
if it appears to be a valid X10 message.

=cut

sub is_x10 {
  my $bytes = shift;

  return unless (scalar @$bytes == 4);

  (($bytes->[2]^0xff) == $bytes->[3] &&
   ($bytes->[0]^0xff) == $bytes->[1] &&
   !($bytes->[2]&0x7));
}

1;
